const {spawn} = require('child_process');


const {
  outcomes: {
    ERROR,
    EXIT,
  },
} = require('./constants');

/**
 * @param {CanonicalHook} hook - string is interpreted as a name of npm
 * script defined in the linked dependency package.json file
 * @param {function} log
 *
 * @returns {ChildProcess}
 */
module.exports = (hook, {log}) => {
  const childProcess = spawn(...hook.spawnArgs);

  // if (hook.isVerbose) {
    childProcess.stdout.on('data', data => {
      log(data.toString());
    });
  // }

  childProcess.on('error', data => {
    log(`${ ERROR }`, data.toString());
  });

  childProcess.on('close', code => {
    log(`${ EXIT } (${ code })`);
  });

  return childProcess;
};

