#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const spawnChild = require('./spawnChild');

const {
  classes: {
    val,
    dir,
    id,
    act,
    cmd
  },
} = require('./style');

const {
  states: {
    LINKED,
    INSTALLED
  },
  outcomes: {
    ERROR,
  },
} = require('./constants');

const baseLog = require('./log');
const analyseValue = require('./analyseValue');

module.exports = (pkgName, value, config) => {
  const log = baseLog.bind(null, id(pkgName));
  const configValueDesc = `(path set: ${ val(value) })`;

  const analysisResult = analyseValue(pkgName, value, {
    onUnlink: (isPackageAbsPathLink) => {
      if (isPackageAbsPathLink) {
        log(`Ignored by configuration ${ configValueDesc
          }. It may be that it should be unlinked. Run ${
          getCommandHint('localdev-link') } to unlink it`);
      }
    },
    onHookDisabled: () => {
      log(`Ignoring: hook disabled`);
    }
  });

  if (typeof analysisResult !== 'object') {
    if (analysisResult) {
      log(analysisResult);
    }

    return;
  }

  const {
    pkgAbsPathIsLink,
    workingCopyAbsPath,
  } = analysisResult;

  if (!fs.existsSync(workingCopyAbsPath)) {
    log(`${ INSTALLED }. No local working copy exists ${ configValueDesc }`);
  }

  // Note: installed packages are unlikely to have all dependencies needed to
  // run a hook bundled. Let's not even try.
  if (!pkgAbsPathIsLink) {
    log(`${ INSTALLED }. No hook will be run`);

    return;
  }

  log(`${ LINKED }. Will try running hook`);

  const hook = getHook(pkgName, config);

  if (typeof hook === 'string') {
    const workingCopyPkg =
      require(path.resolve(workingCopyAbsPath, './package.json'));

    if (!workingCopyPkg.scripts) {
      log(`${ ERROR } local hook configured as npm script but ${
        dir('package.json') } contains no ${ id('scripts') }`);

      return;
    }

    if (!workingCopyPkg.scripts[hook]) {
      log(`${ ERROR } local hook configured as npm script but ${
        dir('package.json') } contains no script named ${ id(hook) }`);

      return;
    }
  }

  log(act('Starting hook'));

  const childProcess = spawnChild({
    hook,
    cwd: workingCopyAbsPath,
    log: log.bind(null, `in ${ id(pkgName) }:`),
    varbose: config.verboseHooks.includes(hook),
  });

  process.on('exit', () => {
    childProcess.kill();
  })
};

/**
 * Implements hooks -> commonHook cascade.
 *
 * @param {string} pkgName
 * @param {object} config
 * @returns {string|Array} - hook (spawn args)
 */
const getHook = (pkgName, config) => {
  if ('hooks' in config && pkgName in config.hooks) {
    return config.hooks[pkgName];
  }

  return config.commonHook;
};

/**
 * @param {string} binName
 * @returns {string}
 */
const getCommandHint = binName => {
  const hostPkg = require(path.resolve('./package.json'));

  if (!hostPkg.scripts) {
    return null;
  }

  const scriptsIncludingBin = Object
    .keys(hostPkg.scripts)
    .filter(scriptName => hostPkg.scripts[scriptName].includes(binName));

  if (!scriptsIncludingBin.length) {
    return cmd(`./node_modules/.bin/${ binName }`)
  }

  return scriptsIncludingBin.length > 1 ?
    `one of: [${ scriptsIncludingBin.map(cmd).join(', ') }]` :
    cmd(scriptsIncludingBin[0]);
};


