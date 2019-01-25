const fs = require('fs');
const pathLib = require('path');

const { isDirectory, getPackageConfig } = require('./utils');

function getSortedRepos(root, { ignoreDevDeps }) {
  const repos = getRepos(root, { ignoreDevDeps });
  return sortReposByUpdateOrder(repos);
}

function getRepos(root, { ignoreDevDeps }) {
  const repos = fs
    .readdirSync(root)
    .filter((dir) => isDirectory(pathLib.join(root, dir)))
    .map((dir) => {
      const path = pathLib.join(root, dir);
      const config = getPackageConfig(path);
      return {
        dir,
        path,
        name: config.name,
        version: config.version,
        deps: getDeps(config, { ignoreDevDeps }),
      };
    })
    .filter((r) => r.name);

  // filter out deps we don't care about
  repos.forEach((repo) => {
    const newDeps = {};
    Object.keys(repo.deps)
      .filter((dep) => repos.some((r) => r.name === dep))
      .forEach((dep) => {
        newDeps[dep] = repo.deps[dep];
      });
    repo.deps = newDeps;
  });
  return repos;
}

function getDeps(config, { ignoreDevDeps }) {
  const deps = config.dependencies || {};
  if (ignoreDevDeps) return deps;

  const devDeps = config.devDependencies || {};
  return Object.assign(deps, devDeps);
}

function getUnmetDeps(repo, visited) {
  return Object.keys(repo.deps).filter((dep) => visited.every((visited) => visited.name !== dep));
}

function sortReposByUpdateOrder(repos) {
  repos.sort((a, b) => Object.keys(b.deps).length - Object.keys(a.deps).length);
  const sorted = [];
  while (sorted.length < repos.length) {
    const next = repos
      .filter((r) => sorted.every((visited) => visited.dir !== r.dir))
      .sort((a, b) => getUnmetDeps(b, sorted).length - getUnmetDeps(a, sorted).length)
      .pop();
    sorted.push(next);
  }
  return sorted;
}

module.exports = getSortedRepos;
