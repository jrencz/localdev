const path = require('path');
const findRoot = require('find-root');
const {
  compile
} = require('./scopedConfigReader');

const {
  isObject,
  mapValues,
} = require('./utils');

const isDependency = pkg => name => name in (pkg.dependencies || {}) || name in (pkg.devDependencies || {});

/**
 * @typedef {object} CanonicalDependency
 *
 * @property {?AbsolutePathDependency} path
 * @property {boolean} shouldBeLinked
 */

/**
 * @typedef {string} AbsolutePathDependency
 */

/**
 * @typedef {string} RelativePathDependency
 *
 * String representing RELATIVE path from npm project root calculated from
 * `process.cwd()` to the working copy
 */

/**
 * @typedef {null} IgnoreDependency
 */

/**
 * @typedef {IgnoreDependency|RelativePathDependency|AbsolutePathDependency|CanonicalDependency} Dependency
 */

const LINK_STRATEGY = Symbol(`'link' dependency strategy`);
const IGNORE_STRATEGY = Symbol(`'ignore' dependency strategy`);
const INSTALL_STRATEGY = Symbol(`'install' dependency strategy`);

const getIgnoreCanonicalDependency = () => ({
  strategy: IGNORE_STRATEGY,
});
const getInstallCanonicalDependency = () => ({
  strategy: INSTALL_STRATEGY,
});


const isInstallDependency = dependency => dependency === null;
const isIgnoreDependency = dependency => dependency === false;
const isPathDependency = dependency => typeof dependency === 'string';
const isAbsolutePathDependency =
  dependency => isPathDependency(dependency) && path.isAbsolute(dependency);
const isRelativePathDependency =
  dependency => isPathDependency(dependency) && !path.isAbsolute(dependency);
const isCanonicalDependency = dependency => isObject(dependency) &&
  'strategy' in dependency;

const relPathDependencyToAbsPathDependency =
  (relativePathDependency, root) => path.resolve(root, relativePathDependency);
const absPathDependencyToCanonicalDependency = absolutePathDependency => ({
  path: findRoot(absolutePathDependency),
  strategy: LINK_STRATEGY,
});

const ensureCanonicalDependencyName =
  (canonicalDependency, pkgName) => Object.assign(canonicalDependency, {
    name: pkgName,
  });

const strategies = {
  link: LINK_STRATEGY,
  ignore: IGNORE_STRATEGY,
  install: INSTALL_STRATEGY
};
const ensureStrategy = dependency => {
  if ('strategy' in dependency) {
    if (typeof dependency.strategy === 'symbol') {
      return dependency;
    }

    if (typeof dependency.strategy !== 'string') {
      throw new Error(
        `Dependency strategy has to be a string. Given \`${
          typeof dependency.strategy }\``
      );
    }

    if (dependency.strategy in strategies) {
      dependency.strategy = strategies[dependency.strategy];
    } else {
      throw new Error(
        `Unknown dependency strategy \`${ dependency.strategy }\` in \`${
          dependency.name }`
      );
    }
  } else if ('path' in dependency) {
    dependency.strategy = LINK_STRATEGY;
  } else {
    throw new Error(
      `Dependency strategy is required. Dependency: \`${ dependency.name }\``
    );
  }

  return dependency;
};

/**
 * @param {object} config
 * @returns {function(dependency: Dependency): CanonicalDependency}
 */
const getMakeDependencyCanonical = config => (dependency, pkgName) => {
  if (isIgnoreDependency(dependency)) {
    dependency = getIgnoreCanonicalDependency();
  }

  if (isInstallDependency(dependency)) {
    dependency = getInstallCanonicalDependency();
  }

  if (isRelativePathDependency(dependency)) {
    const root = path.dirname(config.config);

    dependency = relPathDependencyToAbsPathDependency(dependency, root);
  }

  if (isAbsolutePathDependency(dependency)) {
    dependency = absPathDependencyToCanonicalDependency(dependency)
  }

  if (!isCanonicalDependency(dependency)) {
    throw new Error(
      `Can't get canonical dependency: ${ JSON.stringify(dependency) }`
    );
  }

  return ensureStrategy(ensureCanonicalDependencyName(dependency, pkgName));
};

const configName = 'dependencies';

module.exports = {
  isDependency,
  /**
   * Combines dependencies from common (i.e. expressed on the root level of
   * configuration) and scoped.
   * @param config
   * @returns {Object.<string, Dependency>}
   */
  compile: config => {
    const dependencies = compile(configName, config);

    return mapValues(dependencies, getMakeDependencyCanonical(config));
  },
  /**
   *
   * @param pkgName
   * @param config
   * @returns {CanonicalDependency}
   */
  compileOne: (pkgName, config) => {
    const dependencies = compile(configName, config);

    return pkgName in dependencies ?
      getMakeDependencyCanonical(config)(dependencies[pkgName], pkgName,
        dependencies) :
      null;
  },
  LINK_STRATEGY,
  IGNORE_STRATEGY,
  INSTALL_STRATEGY,
};
