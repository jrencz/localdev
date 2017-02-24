/**
 * @param {string} propertyName
 * @param {{scope: string!, scopes: Object.<string, *>!}} config
 * @returns {Object.<string, *>} - values mapped by package name
 */
const getScopedValues = (propertyName, config) => {
  if (!(config.scope in config.scopes)) {
    throw new Error(`Unknown scope \`${ config.scope }\`. Known scopes are [${
      Object.keys(config.scopes).join('./')
      }]. Mind that scopes have been normalised.`)
  }

  /**
   * @type {object|null}
   */
  const scopedConfig = config.scopes[config.scope];

  return scopedConfig && propertyName in scopedConfig ?
    scopedConfig[propertyName] :
    {};
};

/**
 * @param {string} propertyName
 * @param {{[propertyName]: Object.<string, *>?}} config
 * @returns {Object.<string, *>} - values mapped by package name
 */
const getCommonValues = (propertyName, config) => config[propertyName] || {};

module.exports = {
  compile: (propertyName, config) => Object.assign({},
    getCommonValues(propertyName, config),
    getScopedValues(propertyName, config)
  ),
};
