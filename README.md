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
  [root]        directory where repos are located, defaults to cwd()
  --dryrun, -D  don't make changes
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]

```

This will  scan the given `root` directory for projects that depend on other projects in the same repo. If a repo has out of date local dependencies, then do the following:
1. Bump out of date dependencies
2. Publish a new version as a patch with the commit message 'bump deps'

This process will continue until every package has up-to-date local dependencies.
