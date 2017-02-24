#!/usr/bin/env node

const fs = require('fs');
const {isLink} = require('fs-utils');
const {
  bgGreen,
  bgRed,
  bgYellow,
  bold,
  cyan,
  italic,
  magenta,
  underline,
} = require('colors');
const upper = str => str.toUpperCase();

const {name} = require('../package.json');
const config = require('rc')(name);

const path = require('path');
const pkg = require(path.resolve('./package.json'));
const baseLog = require('../lib/log');
const isDependency = require('../lib/isDependencyOf');
const findRoot = require('find-root');

const npm = require('npm');

npm.load(pkg, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  Object
    .keys(config.packages)
    .filter(isDependency(pkg))
    .map(toPkgNamePathTuple)
    .map(toWorkingCopyPathRelativeFromCwd)
    .forEach(tuple => processPackage(...tuple));
});
const val = name => bold(name);
const dir = name => cyan(name);
const id = name => italic(magenta(name));
const act = name => bold(underline(name));
const state = name => bold(upper(name));
const cmd = name => magenta(bold(name));

const success = name => bgGreen(state(name));
const failure = name => bgRed(state(name));
const alert = name => bgYellow(state(name));

const LINKING = act('linking');
const UNLINKING = act('unlinking');
const INSTALLING = act('installing');

const LINKED = state('linked');
const INSTALLED = state('installed');

const FAILED = failure('failed');
const DONE = success('done');

const toPkgNamePathTuple = pkgName => [pkgName, config.packages[pkgName]];
const toWorkingCopyPathRelativeFromCwd =
  ([pkgName, workingCopyPathRelativeToConfig]) => {
    const workingCopyRootRelPath = workingCopyPathRelativeToConfig ?
      path.relative(
        findRoot(process.cwd()),
        path.resolve(
          path.dirname(config.config),
          workingCopyPathRelativeToConfig
        )
      ) :
      workingCopyPathRelativeToConfig
    ;

    return [pkgName, workingCopyRootRelPath];
  };

const npmUnlink = (pkgName, log) => {
  const PKG = id(pkgName);

  npm.unlink(pkgName, (err) => {
    if (err) {
      log(`${ UNLINKING } ${ PKG } ${ FAILED }`, err);

      return;
    }

    log(`${ UNLINKING } ${ DONE }. Package ${
      act('will now be installed') } from the registry`);

    npm.install(pkgName, (err) => {
      if (err) {
        log(`${ INSTALLING } ${ FAILED }`, err);

        return;
      }

      log(`${ INSTALLING } ${ DONE }. Package is now ${
        INSTALLED } from the registry`);
    })
  });
};

const processPackage = (pkgName, workingCopyRootRelPath) => {
  const log = baseLog.bind(null, id(pkgName));

  // Note: only direct dependencies can be linked.
  const pkgAbsPath = path.resolve('./node_modules/', pkgName);

  if (!fs.existsSync(pkgAbsPath)) {
    log(`is ${ alert('not') }${ INSTALLED } in this project although it is ` +
      `a dependency. Run ${ cmd(`npm i ${ pkgName }`) } and retry`);

    return;
  }

  if (!workingCopyRootRelPath) {
    const description = `(config was ${ val(workingCopyRootRelPath) })`;

    if (isLink(pkgAbsPath)) {
      log(`${ act('will be unlinked') } ${ description }`);
      npmUnlink(pkgName, log);
    } else {
      log(`is already ${ INSTALLED } from registry ${ description
        }. Ignoring`);
    }

    return;
  }

  const workingCopyAbsPath = path.resolve(workingCopyRootRelPath);

  if (fs.existsSync(workingCopyAbsPath)) {
    if (isLink(pkgAbsPath)) {
      log(`is already ${ LINKED }. Leaving as is`);

      return;
    }

    log(`${ act('will be linked') }. It was found in ${
      dir(workingCopyRootRelPath) }`);

    npm.link(workingCopyRootRelPath, (err) => {
      if (err) {
        log(`${ LINKING } ${ FAILED }`);
      }

      log(`${ LINKING } ${ DONE }`);
    });
  } else {
    if (isLink(pkgAbsPath)) {
      // TODO: resolve workingCopyPath in cwd. In case config is
      // somewhere above it will not be readable.
      // For now absolute path is used.
      log(`${ act('will be unlinked') }. Working copy no longer exists in ${
        dir(workingCopyAbsPath) }`);

      npmUnlink(pkgName, infix);
    } else if (fs.existsSync(pkgAbsPath)) {
      log(`is ${ INSTALLED }. No local working copy exists`);
    }
  }
};
