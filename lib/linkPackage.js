const fs = require('fs');
const path = require('path');

const {
  classes: {
    val,
    dir,
    id,
    act,
  },
} = require('./style');

const {
  actions: {
    LINKING,
    UNLINKING,
    INSTALLING,
  },
  states: {
    LINKED,
    INSTALLED
  },
  outcomes: {
    FAILED,
    DONE,
  },
} = require('./constants');

const baseLog = require('./log');
const analyseValue = require('./analyseValue');

module.exports = npm => (pkgName, value) => {
  const log = baseLog.bind(null, id(pkgName));
  const configValueDesc = `(path set: ${ val(value) })`;

  const analysisResult = analyseValue(pkgName, value, {
    onUnlink: (isPackageAbsPathLink) => {
      if (isPackageAbsPathLink) {
        // NOTE: here's where it differs from start.
        log(`${ act('will be unlinked') } ${ configValueDesc }`);

        npmUnlink(pkgName, {npm, log});
      } else {
        log(`is already ${ INSTALLED } from registry ${
          configValueDesc }. Ignoring`);
      }
    }
  });

  if (typeof analysisResult !== 'object') {
    if (analysisResult) {
      log(analysisResult);
    }

    return;
  }

  const {
    pkgAbsPath,
    pkgAbsPathIsLink,
    workingCopyRootRelPath,
    workingCopyAbsPath,
  } = analysisResult;

  if (fs.existsSync(workingCopyAbsPath)) {
    if (pkgAbsPathIsLink) {
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
    if (pkgAbsPathIsLink) {
      // TODO: resolve workingCopyPath in cwd. In case config is
      // somewhere above it will not be readable.
      // For now absolute path is used.
      log(`${ act('will be unlinked') }. Working copy no longer exists in ${
        dir(workingCopyAbsPath) }`);

      npmUnlink(pkgName, {npm, log});
    } else if (fs.existsSync(pkgAbsPath)) {
      log(`is ${ INSTALLED }. No local working copy exists ${ configValueDesc }`);
    }
  }
};

const npmUnlink = (pkgName, {npm, log}) => {
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
