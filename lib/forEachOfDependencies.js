const path = require('path');
const {normalisePathScopes} = require('./pathScopes');
const {isDependency} = require('./dependencies');
const {
  mapValues,
  pickBy,
} = require('./utils');

const prepareConfig = config => {
  normalisePathScopes(config);
};

const pkg = require(path.resolve('./package.json'));

module.exports = ({
  compiler,
  processor,
  config
}) => {
  prepareConfig(config);

  const process = value => processor(value, config);
  const dependencyProcessorInputs = pickBy(compiler(config), isDependency(pkg));

  mapValues(dependencyProcessorInputs, process);
};
