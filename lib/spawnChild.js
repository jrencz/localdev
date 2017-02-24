const {spawn} = require('child_process');


const {
  outcomes: {
    ERROR,
    EXIT,
  },
} = require('./constants');

/**
 * @param {string, Array} hook - string is interpreted as a name of npm script
 * defined in the linked dependency package.json file
 * @param {string} cwd
 * @param {function} log
 * @param {boolean} verbose
 *
 * @returns {ChildProcess}
 */
module.exports = ({hook, cwd, log, verbose = false}) => {
  const childProcess = spawn(...(
    typeof hook === 'string' ?
      getSpawnArgsForNpmScript(hook, {cwd}) :
      addOptionsToSpawnArgs(hook, {cwd})
  ));

  if (verbose) {
    childProcess.stdout.on('data', data => {
      log(data.toString());
    });
  }

  childProcess.on('error', data => {
    log(`${ ERROR }`, data.toString());
  });

  childProcess.on('close', code => {
    log(`${ EXIT } (${ code })`);
  });

  return childProcess;
};

const addOptionsToSpawnArgs = ([command, args, options], baseOptions) =>
  [command, args, Object.assign({}, baseOptions, options)];

const getSpawnArgsForNpmScript = (scriptName, options) =>
  addOptionsToSpawnArgs(['npm', ['run', scriptName]], options);
