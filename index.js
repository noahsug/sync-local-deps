#!/usr/bin/env node

const path = require('path')
const yargs = require('yargs')

const syncLocalDeps = require('./syncLocalDeps')

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
    skipPublish: {
      alias: 'P',
      describe: 'list of directories to not npm publish',
      type: 'array',
      default: [],
    },
  }).argv

function getRoot(userRoot) {
  const root = userRoot || process.cwd()
  return path.isAbsolute(root) ? root : path.join(process.cwd(), root)
}

syncLocalDeps(
  Object.assign(options, {
    root: getRoot(options.root),
  })
)
