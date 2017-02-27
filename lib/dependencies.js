const isDependency = require('./isDependencyOf');

/**
 * @param {{scope: string!, scopes: Object.<string, *>!}} config
 * @returns {Object.<string, string|null|false>} - dependencies object.
 */
const getScopedDependencies = config => {
  if (!(config.scope in config.scopes)) {
    throw new Error(`Unknown scope \`${ config.scope }\`. Known scopes are [${
      Object.keys(config.scopes).join('./')
      }]. Mind that scopes have been normalised.`)
  }

  /**
   * @type {object|null}
   */
  const scopedConfig = config.scopes[config.scope];

  return scopedConfig && 'dependencies' in scopedConfig ?
    scopedConfig.dependencies :
    {};
};

/**
 * @param {{dependencies: Object.<string, string|null|false>?}} config
 * @returns {Object.<string, string|null|false>} - dependencies object.
 */
const getCommonDependencies = config => config.dependencies || {};

module.exports = {
  isDependency,
  /**
   * Combines dependencies from common (i.e. expressed on the root level of
   * configuration) and scoped.
   * @param config
   */
  compile: config => Object.assign({},
    getCommonDependencies(config),
    getScopedDependencies(config)
  ),
};
