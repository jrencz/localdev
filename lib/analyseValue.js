const fs = require('fs');
const path = require('path');
const {isLink} = require('fs-utils');

// TODO: change it to symbols before it reaches this point maybe?
const VALUE_HOOK_DISABLED = false;
const VALUE_PATH_UNLINK = null;

const {
  classes: {
    cmd
  },
  states: {
    alert
  },
} = require('./style');

const {
  states: {
    INSTALLED
  },
  outcomes: {
    ERROR,
  },
} = require('./constants');

/**
 * @param {string} pkgName
 * @param {string|VALUE_HOOK_DISABLED|VALUE_PATH_UNLINK} value
 * @param {function} onHookDisabled
 * @param {function} onUnlink
 * @returns {*}
 */
module.exports = (pkgName, value, {
  onHookDisabled = () => {},
  onUnlink = () => {},
}) => {
  // Note: only direct dependencies can be linked.
  const pkgAbsPath = path.resolve('./node_modules/', pkgName);

  if (!fs.existsSync(pkgAbsPath)) {
    return `is ${ alert(' not ') } ${ INSTALLED
      } in this project although it is a dependency. Run ${
      cmd(`npm i ${ pkgName }`) } and retry`;
  }

  if (value === VALUE_HOOK_DISABLED) {
    onHookDisabled();

    return;
  }

  if (value === VALUE_PATH_UNLINK) {
    onUnlink(isLink(pkgAbsPath));

    return;
  }

  if (typeof value !== 'string') {
    return `${ ERROR } package misconfiguration`;
  }

  // From this point on value may be considered a relative path to the root of
  // linked module.
  const workingCopyRootRelPath = value;
  const workingCopyAbsPath = path.resolve(workingCopyRootRelPath);

  return {
    pkgAbsPath,
    pkgAbsPathIsLink: isLink(pkgAbsPath),
    workingCopyRootRelPath,
    workingCopyAbsPath,
  }
};
