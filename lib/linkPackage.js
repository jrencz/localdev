const fs = require('fs');
const path = require('path');
const {isLink} = require('fs-utils');

const {
  classes: {
    dir,
    id,
    act,
    cmd,
  },
  states: {
    alert
  },
} = require('./style');

const {
  actions: {
    LINKING,
    UNLINKING,
    INSTALLING,
  },
  states: {
    LINKED,
    INSTALLED
  },
  outcomes: {
    FAILED,
    DONE,
  },
} = require('./constants');

const {
  IGNORE_STRATEGY,
  INSTALL_STRATEGY,
  LINK_STRATEGY,
} = require('./dependencies');

const baseLog = require('./log');

const dependencyStrategies = new Map([]);

/**
 * @param {object} npm
 * @returns {function(dependency: CanonicalDependency): undefined}
 */
module.exports = npm => dependency => {
  const log = baseLog.bind(null, id(dependency.name));

  dependencyStrategies
    .set(IGNORE_STRATEGY, () => {
      log('is ignored');
    })
    .set(INSTALL_STRATEGY, () => {
      const dependencyPathInHostNodeModules = getPathToInstalled(dependency);

      if (
        fs.existsSync(dependencyPathInHostNodeModules) &&
        isLink(dependencyPathInHostNodeModules)
      ) {
        log(`${ act('will be unlinked') }. It was configured to be installed`);

        unlinkDependency({npm, log}, dependency);
      } else {
        log(`is already ${ INSTALLED }. Leaving as is`);
      }
    })
    .set(LINK_STRATEGY, () => {
      // Note: only direct dependencies can be linked.
      const dependencyPathInHostNodeModules = getPathToInstalled(dependency);

      if (!fs.existsSync(dependencyPathInHostNodeModules)) {
        log(`is ${ alert(' not ') } ${ INSTALLED
          } in this project although it is a dependency. Run ${
          cmd(`npm i ${ dependency.name }`) } and retry`);
      }

      if (fs.existsSync(dependency.path)) {
        if (isLink(dependencyPathInHostNodeModules)) {
          log(`is already ${ LINKED }. Leaving as is`);

          return;
        }

        linkDependency({npm, log}, dependency);
      } else {
        if (isLink(dependencyPathInHostNodeModules)) {
          log(`${ act('will be unlinked') }. Working copy no longer exists in ${
            dir(dependency.path) }`);

          unlinkDependency({npm, log}, dependency);
        }
      }
    })
  ;

  if (!dependencyStrategies.has(dependency.strategy)) {
    log(`Dependency strategy not implemented`, dependency);

    return;
  }

  dependencyStrategies.get(dependency.strategy)(dependency);

};

const getPathToInstalled = dependency => path.resolve('./node_modules/', dependency.name);

const linkDependency = ({npm, log}, dependency) => {
  const link = npmCall(npm, 'link');
  const workingCopyRootRelPath =
    path.relative(path.resolve('./'), dependency.path);

  log(`${ act('will be linked') }. It was found in ${
    dir(workingCopyRootRelPath) }`);

  link(workingCopyRootRelPath)
    .catch(error => {
      log(`${ LINKING } ${ FAILED }`);

      return Promise.reject(error);
    })
    .then(() => {
      log(`${ LINKING } ${ DONE }`);
    })
};

const unlinkDependency = ({npm, log}, dependency) => {
  const PKG = id(dependency.name);

  const unlink = npmCall(npm, 'unlink');
  const reinstall = npmCall(npm, 'install');

  unlink(dependency.name)
    .catch(error => {
      log(`${ UNLINKING } ${ PKG } ${ FAILED }`, error);

      return Promise.reject(error);
    })
    .then(() => {
      log(`${ UNLINKING } ${ DONE }. Package ${
        act('will now be installed') } from the registry`);

      return reinstall(dependency.name);
    })
    .catch(error => {
      log(`${ INSTALLING } ${ FAILED }`, error);

      return Promise.reject(error);
    })
    .then(() => {
      log(`${ INSTALLING } ${ DONE }. Package is now ${
        INSTALLED } from the registry`);
    });
};

const npmCall = (npm, methodName) =>
  (...args) => new Promise((resolve, reject) => {
    npm[methodName](...args, (err) => {
      if (err) {
        reject(err);

        return;
      }

      resolve();
    });
  });
