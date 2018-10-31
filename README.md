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
  --dryrun, -D         don't make changes
  --npm-version, -v     npm version to bump to, see "npm version --help"
                                                     [string] [default: "patch"]
  --only, -o           only sync the given projects                      [array]
  --skip, -S           list of directories to skip
  --skip-publish, -P   list of directories to not npm publish
  --skip-git-push, -G  list of directories to not git push
  --ignore-dev-deps, -I  don't update dev deps                         [boolean]
  --help               show help
  --version            show version number
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
