const {
  compile
} = require('./scopedConfigReader');

const {
  isObject,
  mapValues,
} = require('./utils');

/**
 * @typedef {object} CanonicalHook
 *
 * @property {string} strategy - `spawn` or `noop`
 * @property {?SpawnArgsHook} spawnArgs - array applied as `spawn` arguments
 * @property {?boolean} isVerbose
 */

/**
 * @typedef {Array} SpawnArgsHook
 *
 * @property {string} command
 * @property {Array.<string>} args
 * @property {object} options
 */

/**
 * @typedef {string} NpmScriptHook
 */

/**
 * @typedef {null} NoopHook
 */

/**
 * @typedef {NoopHook|NpmScriptHook|SpawnArgsHook|CanonicalHook} Hook
 */

const SPAWN_STRATEGY = Symbol(`'spawn' hook strategy`);
const NOOP_STRATEGY = Symbol(`'noop' hook strategy`);

const npmScriptHookToSpawnArgsHook = scriptName => ['npm', ['run', scriptName]];
const spawnArgsHookToCanonicalHook = spawnArgs => ({
  strategy: SPAWN_STRATEGY,
  spawnArgs,
  isVerbose: false,
});

const getNoopHookToCanonicalHook = () => ({
  strategy: NOOP_STRATEGY,
});

const isNoopHook = hook => hook === null;
const isNpmScriptHook =
  maybeNpmScriptHook => typeof maybeNpmScriptHook === 'string';
const isSpawnArgsHook = maybeSpawnArgsHook => Array.isArray(maybeSpawnArgsHook);
const isCanonicalHook = maybeCanonicalHook => isObject(maybeCanonicalHook) &&
  'strategy' in maybeCanonicalHook;

/**
 * Adds options to
 * @param {CanonicalHook} hook
 * @param {object} defaults
 */
const addDefaultHookOptions = (hook, defaults) => Object.assign({}, hook, {
  spawnArgs: addMissingSpawnArgsHookOptions(hook.spawnArgs, defaults),
});

/**
 * @param command
 * @param args
 * @param options
 * @param baseSpawnOptions
 */
const addMissingSpawnArgsHookOptions =
  ([command, args, options], baseSpawnOptions) =>
    [command, args, Object.assign({}, baseSpawnOptions, options)];


const ensureCanonicalHookName =
  (canonicalHook, pkgName) => Object.assign(canonicalHook, {
    name: pkgName,
  });

const strategies = {
  spawn: SPAWN_STRATEGY,
  noop: NOOP_STRATEGY,
};
const ensureStrategy = hook => {
  if ('strategy' in hook) {
    if (typeof hook.strategy === 'symbol') {
      return hook
    }

    if (typeof hook.strategy !== 'string') {
      throw new Error(
        `Hook strategy has to be a string. Given \`${ typeof hook.strategy }\``
      );
    }

    if (hook.strategy in strategies) {
      hook.strategy = strategies[hook.strategy];
    } else {
      throw new Error(
        `Unknown hook strategy \`${ hook.strategy }\` in \`${
          hook.name }`
      );
    }
  } else if ('spawnArgs' in hook) {
    hook.strategy = SPAWN_STRATEGY;
  } else {
    throw new Error(`Hook strategy is required. Hook: \`${ hook.name }\``);
  }

  return hook;
};

/**
 * @param {Hook} hook
 * @param {string} pkgName
 * @returns {CanonicalHook}
 */
const makeHookCanonical = (hook, pkgName) => {
  if (isNoopHook(hook)) {
    hook = getNoopHookToCanonicalHook(hook);
  }

  if (isNpmScriptHook(hook)) {
    hook = npmScriptHookToSpawnArgsHook(hook)
  }

  if (isSpawnArgsHook(hook)) {
    hook = spawnArgsHookToCanonicalHook(hook);
  }

  if (!isCanonicalHook(hook)) {
    throw new Error(`Can't get canonical hook: ${ JSON.stringify(hook) }`);
  }

  return ensureStrategy(ensureCanonicalHookName(hook, pkgName));
};

const configName = 'hooks';

module.exports = {
  /**
   * @param {{hooks: Object.<string, Hook>?}} config
   * @returns {Object.<string, Hook>} - hooks map
   */
  compile: config => {
    const compiled = compile(configName, config);

    return mapValues(compiled, makeHookCanonical);
  },
  addDefaultHookOptions,
  SPAWN_STRATEGY,
  NOOP_STRATEGY,
};
