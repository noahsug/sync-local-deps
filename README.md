# sync-local-deps
> Keep local npm projects that depend on each other in sync

## Install
```
git clone https://github.com/noahsug/sync-local-deps.git
cd sync-local-deps
npm install
```

## Usage
```sh
node <path-to-sync-local-deps> [root] [options]

Options:
  [root]              directory where repos are located, defaults to cwd()
  --dryrun, -D        don't make changes
  --skip-publish, -P  list of directories to not npm publish
  --help              show help
  --version           show version number

```

sync-local-deps does the following:
1. scans the given `root` directory for projects that depend on other projects in `root`
1. build a dependency graph between projects so they're updated in the correct order
1. for each project with out of date local dependencies, do the following:
  1. bump out of date local dependencies
  1. publish a new version as a patch with commit message 'bump deps'

This process continues until every package has up-to-date local dependencies.
