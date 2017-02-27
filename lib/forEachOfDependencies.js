const path = require('path');
const findRoot = require('find-root');
const {normalisePathScopes} = require('./pathScopes');
const {
  compile: compileDependencies,
  isDependency,
} = require('./dependencies');

const processConfig = config => {
  normalisePathScopes(config);
};

module.exports = (fn, config) => {
  processConfig(config);

  const dependencies = compileDependencies(config);
  const configFilePath = config.config;

  Object
    .keys(dependencies)
    .filter(isDependency(pkg))
    .map(toPkgNamePathTuple(dependencies))
    .map(toWorkingCopyPathRelativeFromCwd(configFilePath))
    .forEach(tuple => fn(...tuple, config));
};

const pkg = require(path.resolve('./package.json'));
const toPkgNamePathTuple = dependencies =>
  pkgName => [pkgName, dependencies[pkgName]];
const toWorkingCopyPathRelativeFromCwd =
  pathResolutionRoot => ([pkgName, workingCopyPathRelativeToConfig]) => {
    const workingCopyRootRelPath = workingCopyPathRelativeToConfig ?
      path.relative(
        findRoot(process.cwd()),
        path.resolve(
          path.dirname(pathResolutionRoot),
          workingCopyPathRelativeToConfig
        )
      ) :
      workingCopyPathRelativeToConfig
    ;

    return [pkgName, workingCopyRootRelPath];
  };
