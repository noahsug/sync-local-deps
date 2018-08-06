const chalk = require('chalk')
const semver = require('semver')
const { execSync } = require('child_process')

const getSortedRepos = require('./getSortedRepos')
const { getPackageConfig } = require('./utils')

function syncLocalDeps({ dryrun, root, skip, skipPublish }) {
  const repos = getSortedRepos(root)
  console.log('syncing', repos.length, 'projects found in', chalk.yellow(root))
  console.log('')

  repos.forEach(r => {
    if (skip.includes(r.dir)) return

    const deps = getDepsToUpdate(r, repos)
    if (deps.length) {
      if (hasGitChanges(r.path)) {
        console.log(
          'Skipping',
          chalk.yellow(r.dir),
          '- found uncomitted changes'
        )
        return
      }

      console.log('bumping', chalk.yellow(r.dir), 'deps:', deps.join(', '))
      updateDeps(deps, { dryrun, cwd: r.path })
      if (!skipPublish.includes(r.dir)) {
        publishPackage(r, { dryrun, cwd: r.path })
      }
      doCmd('git push', { dryrun, cwd: r.path })
      console.log('')
    }
  })
}

function getDepsToUpdate(sourceRepo, repos) {
  return Object.keys(sourceRepo.deps)
    .map(dep => repos.find(repo => repo.name === dep))
    .filter(depRepo => !!depRepo)
    .filter(depRepo => {
      const version = semver.coerce(sourceRepo.deps[depRepo.name]).raw
      return semver.lt(version, depRepo.version)
    })
    .map(depRepo => depRepo.name)
}

function hasGitChanges(path) {
  return execSync('git status --porcelain', { cwd: path }).length
}

function doCmd(cmd, { dryrun, cwd }) {
  console.log(chalk.gray(cmd))
  if (dryrun === false) {
    return execSync(cmd, { cwd }).toString()
  }
}

function updateDeps(deps, options) {
  const depInstallStrs = deps.map(d => d + '@latest')
  doCmd(`npm install --save ${depInstallStrs.join(' ')}`, options)
  doCmd(`git commit -am 'bump deps'`, options)
}

function publishPackage(r, options) {
  doCmd('npm version patch && npm publish', options)
  if (options.dryrun) {
    r.version = semver.inc(r.version, 'patch')
  } else {
    r.version = getPackageConfig(r.path).version
  }
}

module.exports = syncLocalDeps
