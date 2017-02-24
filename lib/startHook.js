const {
  addDefaultHookOptions,
  SPAWN_STRATEGY,
  NOOP_STRATEGY,
} = require('./hooks');

const spawnHook = require('./spawnHook');

const {
  compileOne: compileDependency,
} = require('../lib/dependencies');

const {
  classes: {
    id,
    act,
    cmd
  },
} = require('./style');

const baseLog = require('./log');

const hookStrategies = new Map([]);

/**
 * @param {CanonicalHook} hook
 * @param config
 */
module.exports = (hook, config) => {
  const log = baseLog.bind(null, id(hook.name));

  hookStrategies
    .set(SPAWN_STRATEGY, spawnHookStrategyFactory({
      dependency: compileDependency(hook.name, config),
      log,
    }))
    .set(NOOP_STRATEGY, () => {
      log(`Ignoring: hook disabled`);
    });

  if (!hookStrategies.has(hook.strategy)) {
    log(`Hook strategy not implemented`, hook);

    return;
  }

  hookStrategies.get(hook.strategy)(hook);
};

const spawnHookStrategyFactory = ({dependency, log}) => hook => {
  const CMD = cmd([
    hook.spawnArgs[0],
    ...hook.spawnArgs[1]
  ].join(' '));

  log(`${ act('Spawning') } ${ CMD }`);

  hook = addDefaultHookOptions(hook, {
    cwd: dependency ?
      dependency.path :
      process.cwd()
  });

  const childProcess = spawnHook(hook, {
    log: log.bind(null, `>>`),
  });

  process.on('exit', () => {
    childProcess.kill();
  })
};
