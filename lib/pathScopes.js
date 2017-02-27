const path = require('path');
const findRoot = require('find-root');

/**
 * Resolves relative path scopes to absolute path scopes.
 *
 * * takes path relative to the config file
 * * returns absolute path of the root of npm package the relative path
 * points at (which means relative path can point deeper into that package but
 * it doesn't matter)
 *
 * @param pathScope
 * @param config
 */
const normalisePathScope = (pathScope, config) => {
  if (path.isAbsolute(pathScope)) {
    return pathScope;
  }

  const configFilePath = path.dirname(config.config);

  return findRoot(path.resolve(configFilePath, pathScope));
};

const isRelativePathScope = string => string.startsWith('./');
const isAbsolutePathScope = string => path.isAbsolute(string);
const isPathScope = string => typeof string === 'string' && (
  isRelativePathScope('./') || isAbsolutePathScope(string)
);

const normaliseChosenScope = config => {
  // If there's no scope defined imply root of npm module localdev is run in.
  config.scope = ('scope' in config && isPathScope(config.scope)) ?
    normalisePathScope(config.scope, config) :
    findRoot(process.cwd())
};

const normaliseConfiguredScopes = config => {
  Object
    .keys(config.scopes || {})
    .filter(isRelativePathScope)
    .forEach(relativePath => {
      const absolutePath = normalisePathScope(relativePath, config);

      config.scopes[absolutePath] = config.scopes[relativePath];

      delete config.scopes[relativePath];
    })
};

module.exports = {
  /**
   * Path scopes can be expressed as relative or absolute. This function makes
   * them all absolute.
   *
   * @note It *mutates* the given object. Value for key `scope` may be changed
   * and keys in the object given as `scopes` may change.
   *
   * @param {object} config
   * @returns {undefined}
   */
  normalisePathScopes: config => {
    normaliseChosenScope(config);
    normaliseConfiguredScopes(config);
  }
};
