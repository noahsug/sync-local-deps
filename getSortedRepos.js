const fs = require('fs')
const pathLib = require('path')

const { isDirectory, getPackageConfig } = require('./utils')

function getSortedRepos(root) {
  const repos = getRepos(root)
  return sortReposByUpdateOrder(repos)
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

function getDeps(config) {
  const deps = config.dependencies || {}
  const devDeps = config.devDependencies || {}
  return Object.assign(deps, devDeps)
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

module.exports = getSortedRepos
