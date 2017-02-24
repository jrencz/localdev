const path = require('path');
const findRoot = require('find-root');

const isDependency = require('./isDependencyOf');

module.exports = (fn, config) => {

  Object
    .keys(config.packages)
    .filter(isDependency(pkg))
    .map(toPkgNamePathTuple(config.packages))
    .map(toWorkingCopyPathRelativeFromCwd(config.config))
    .forEach(tuple => fn(...tuple, config));
};

const pkg = require(path.resolve('./package.json'));
const toPkgNamePathTuple = packages => pkgName => [pkgName, packages[pkgName]];
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
