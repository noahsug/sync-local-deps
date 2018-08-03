#!/usr/bin/env node

const fs = require('fs')
const semver = require('semver')
const pathLib = require('path')
const yargs = require('yargs')
const chalk = require('chalk')
const { execSync } = require('child_process')

const options = yargs
  .command('$0 [root]', 'bump deps', yargs => {
    yargs.positional('root', {
      describe: 'directory where repos are located, defaults to cwd()',
      type: 'string',
    })
  })
  .options({
    dryrun: {
      alias: 'D',
      describe: `don't make changes`,
      default: false,
    },
  }).argv

function getRoot(userRoot) {
  const root = userRoot || process.cwd()
  return pathLib.isAbsolute(root) ? root : pathLib.join(process.cwd(), root)
}

function isDirectory(file) {
  let stats
  try {
    stats = fs.statSync(file)
  } catch (e) {
    return false
  }
  return stats && stats.isDirectory()
}

function getPackageConfig(path) {
  const packagePath = pathLib.join(path, 'package.json')
  if (!fs.existsSync(packagePath)) return false

  let config
  try {
    const packageJson = fs.readFileSync(packagePath, 'utf-8')
    config = JSON.parse(packageJson)
  } catch (e) {
    return {}
  }
  return config
}

function getDeps(config) {
  const deps = config.dependencies || {}
  const devDeps = config.devDependencies || {}
  return Object.assign(deps, devDeps)
}

function getRepos(root) {
  return fs
    .readdirSync(root)
    .filter(dir => isDirectory(pathLib.join(root, dir)))
    .map(dir => {
      const path = pathLib.join(root, dir)
      const config = getPackageConfig(path)
      return {
        dir,
        path,
        name: config.name,
        version: config.version,
        deps: getDeps(config),
      }
    })
    .filter(r => r.name)
}

function sortReposByUpdateOrder(repos) {
  const sorted = []
  while (sorted.length < repos.length) {
    const next = repos.find(r => {
      if (sorted.find(visited => visited.name === r.name)) return false

      const deps = Object.keys(r.deps)
        .filter(dep => sorted.every(visited => visited.name !== dep))
        .filter(dep => repos.find(repo => repo.name === dep))
      return deps.length === 0
    })
    sorted.push(next)
  }
  return sorted
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

function doCmd(cmd, dryrun) {
  console.log(chalk.gray(cmd))
  if (dryrun === false) {
    execSync(cmd)
  }
}

function updateDeps(deps, dryrun) {
  const depInstallStrs = deps.map(d => d + '@latest')
  doCmd(`npm install --save ${depInstallStrs.join(' ')}`, dryrun)
  doCmd(`git commit -am 'bump deps'`, dryrun)
}

function publishPackage(r, dryrun) {
  doCmd('npm version patch && npm publish && git push', dryrun)
  if (dryrun) {
    r.version = semver.inc(r.version, 'patch')
  } else {
    r.version = getPackageConfig(r.path).version
  }
}

const { dryrun } = options
const root = getRoot(options.root)
const repos = getRepos(root)
const sortedRepos = sortReposByUpdateOrder(repos)
sortedRepos.forEach(r => {
  const deps = getDepsToUpdate(r, repos)
  if (deps.length) {
    if (hasGitChanges(r.path)) {
      console.log('Skipping', chalk.yellow(r.dir), '- found uncomitted changes')
      return
    }

    doCmd(`cd ${r.path}`, dryrun)
    updateDeps(deps, dryrun)
    publishPackage(r, dryrun)
    doCmd('cd -', dryrun)
    console.log('')
  }
})
