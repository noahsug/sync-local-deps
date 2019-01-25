#!/usr/bin/env node

const path = require('path');
const yargs = require('yargs');

const syncLocalDeps = require('./syncLocalDeps');

const options = yargs
  .command('$0 [root]', 'bump deps', (yargs) => {
    yargs.positional('root', {
      describe: 'directory where repos are located, defaults to cwd()',
      type: 'string',
    });
  })
  .options({
    dryrun: {
      alias: 'D',
      describe: `don't make changes`,
      default: false,
    },
    skip: {
      alias: 'S',
      describe: 'list of directories to skip',
      type: 'array',
      default: [],
    },
    skipPublish: {
      alias: 'P',
      describe: 'list of directories to not npm publish',
      type: 'array',
      default: [],
    },
    skipGitPush: {
      alias: 'G',
      describe: 'list of directories to not git push',
      type: 'array',
      default: [],
    },
    only: {
      alias: 'o',
      describe: 'only sync the given projects, looks at cwd if empty',
      type: 'array',
    },
    ignoreDevDeps: {
      alias: 'I',
      describe: "don't update dev deps",
      type: 'boolean',
    },
    npmVersion: {
      alias: 'v',
      describe: 'npm version to bump to, see "npm version --help"',
      type: 'string',
      default: 'patch',
    },
  }).argv;

function getRoot(userRoot) {
  const root = userRoot || process.cwd();
  return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
}

const root = getRoot(options.root);

const currentRepo = path.basename(process.cwd());
function useCurrentRepoIfEmpty(arr) {
  if (arr && arr.length === 0) {
    arr[0] = currentRepo;
  }
}

// use current repo if an array command is passed as an empty array
[options.skip, options.skipPublish, options.skipGitPush, options.only].forEach(
  useCurrentRepoIfEmpty
);

syncLocalDeps({
  ...options,
  root,
});
