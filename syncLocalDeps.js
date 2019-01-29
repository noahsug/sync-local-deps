const chalk = require('chalk');
const semver = require('semver');
const { execSync } = require('child_process');

const getSortedRepos = require('./getSortedRepos');
const { getPackageConfig } = require('./utils');

function syncLocalDeps({
  dryrun,
  root,
  skip,
  skipPublish,
  skipGitPush,
  only,
  ignoreDevDeps,
  npmVersion,
  upgradeAll,
}) {
  const repos = getSortedRepos(root, { ignoreDevDeps });
  console.log('syncing', repos.length, 'projects found in', chalk.yellow(root));
  console.log('');

  repos.forEach((r) => {
    if (skip.includes(r.dir) || (only && only.length > 0 && !only.includes(r.dir))) return;

    const { deps, stats } = getDepsToUpdate(r, repos, { upgradeAll });
    if (deps.length) {
      if (hasGitChanges(r.path)) {
        console.log('skipping', chalk.yellow(r.dir), '- found uncomitted changes');
        if (!dryrun) {
          console.log();
          return;
        }
      } else {
        console.log('bumping', chalk.yellow(r.dir));
      }

      stats.forEach(({ name, from, to }) => {
        console.log(chalk.blue(name), from, '->', to);
      });

      updateDeps(deps, { dryrun, cwd: r.path });
      if (!skipPublish.includes(r.dir)) {
        publishPackage(r, npmVersion, { dryrun, cwd: r.path });
      }
      if (!skipGitPush.includes(r.dir)) {
        doCmd('git push', { dryrun, cwd: r.path });
      }
      console.log();
    }
  });
}

function getDepsToUpdate(sourceRepo, repos, { upgradeAll }) {
  const stats = [];
  const deps = Object.keys(sourceRepo.deps)
    .map((dep) => repos.find((repo) => repo.name === dep))
    .filter((depRepo) => !!depRepo)
    .filter((depRepo) => {
      const satisfied = satisfiesSemVer(depRepo.version, sourceRepo.deps[depRepo.name], {
        upgradeAll,
      });
      if (!satisfied) {
        stats.push({
          name: depRepo.name,
          from: sourceRepo.deps[depRepo.name],
          to: depRepo.version,
        });
      }
      return !satisfied;
    })
    .map((depRepo) => depRepo.name);
  return { deps, stats };
}

function satisfiesSemVer(version, range, { upgradeAll }) {
  return upgradeAll
    ? semver.lt(version, semver.coerce(range).raw)
    : semver.satisfies(version, range);
}

function hasGitChanges(path) {
  return execSync('git status --porcelain', { cwd: path }).length;
}

function doCmd(cmd, { dryrun, cwd, required }) {
  console.log(chalk.gray(cmd));
  if (dryrun === false) {
    try {
      return execSync(cmd, { cwd }).toString();
    } catch (e) {
      if (required) throw e;
      console.log(chalk.red('Warning:'), 'command failed:');
      console.log(e);
    }
  }
  return undefined;
}

function updateDeps(deps, options) {
  const depInstallStrs = deps.map((d) => d + '@latest');
  doCmd(`npm install --save ${depInstallStrs.join(' ')}`, {
    required: true,
    ...options,
  });
  doCmd(`git commit -am 'bump deps'`, options);
}

function publishPackage(r, version, options) {
  doCmd(`npm version ${version} && npm publish`, options);
  if (options.dryrun) {
    r.version = semver.inc(r.version, version);
  } else {
    r.version = getPackageConfig(r.path).version;
  }
}

module.exports = syncLocalDeps;
