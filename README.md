# sync-local-deps

> Keep your local npm packages up-to-date with each other

## Install

```
npm install -g sync-local-deps
```

## Usage

```sh
sync-local-deps [root] [options]

Options:
  [root]               directory where projects are located, defaults to cwd()
  --dryrun, -D         don't make changes                       [default: false]
  --skip, -S           list of directories to skip         [array] [default: []]
  --skipPublish, -P    list of directories to not npm publish
                                                           [array] [default: []]
  --skipGitPush, -G    list of directories to not git push [array] [default: []]
  --ignoreDevDeps, -I  don't update dev deps                           [boolean]
  --updateAll, -a     include even those dependencies whose latest version
                       satisfies the declared semver dependency        [boolean]
  --npmVersion, -v     npm version to bump to, see "npm version --help"
                                                     [string] [default: "patch"]
  --only, -o           only sync the given projects, looks at cwd if empty
                                                                         [array]
  --help               Show help                                       [boolean]
  --version            Show version number                             [boolean]
```

sync-local-deps does the following:

1. scans the given `root` directory for projects that depend on other projects in `root`
1. build a dependency graph between projects so they're updated in the correct order
1. for each project with out-of-date local dependencies:
   1. `npm install --save dep1@latest dep2@latest ...`
   1. `git commit -am 'bump deps'`
   1. `npm version patch && npm publish`
   1. `git push`

This process continues until every package has up-to-date local dependencies.

The output will looks something like this:
![](https://raw.github.com/noahsug/sync-local-deps/master/example.png)
