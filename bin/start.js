#!/usr/bin/env node

require('json5/lib/require');

const path = require('path');
const fs = require('fs');
const {isLink} = require('fs-utils');
const {
  magenta,
  cyan,
  red,
} = require('colors');
const {spawn} = require('child_process');

const commonYargsConfig = require('../lib/commonYargsConfig');
const {argv} = commonYargsConfig(require("yargs"));

const pkg = require(path.resolve('./package.json'));
const prefix = cyan('[localdev:start]');
const log = (...msgs) => {
  console.log(`${ prefix }`, ...msgs);
};
const isDependency = require('../lib/isDependencyOf')(pkg);
const config = require(path.resolve(argv.config));

Object
  .keys(config)
  .forEach(locallyDevelopedDependencyName => {
    const infix = `package ${ magenta(locallyDevelopedDependencyName) }`;

    if (!isDependency(locallyDevelopedDependencyName)) {
      log(`${ infix } is NOT A DEPENDENCY. Ignoring.`);

      return;
    }

    // Note: only direct dependencies can be linked.
    const pkgAbsPath = path.resolve('./node_modules/', locallyDevelopedDependencyName);
    const wcRelPath = config[locallyDevelopedDependencyName];
    const wcAbsPath = path.resolve(wcRelPath);

    const scriptName = 'localdev-start';

    if (fs.existsSync(wcAbsPath)) {
      if (isLink(pkgAbsPath)) {
        const wcPackageJsonAbsPath = path.resolve(wcAbsPath, './package.json');
        const wcPackageJson = require(wcPackageJsonAbsPath);

        if (scriptName in wcPackageJson.scripts) {
          log(`${ infix } HAS \`${ cyan(scriptName) }\`. Starting.`);

          const localDevProcess = spawn('npm', ['run', scriptName], {
            cwd: wcAbsPath,
          });

          localDevProcess.stdout.on('data', data => {
            log(`from ${ magenta(locallyDevelopedDependencyName) }`, data.toString());
          });

          localDevProcess.on('error', data => {
            log(`${ infix } localdev ${ red('PROBLEM') }`, data.toString());
          });

          localDevProcess.on('close', code => {
            log(`${ infix } localdev ${ red('EXITED') } with code`, code);
          });

          process.on('exit', () => {
            localDevProcess.kill();
          })
        } else {
          log(`${ infix } HAS NO \`${ cyan(scriptName) }\`.`);
        }
      } else {
        log(`${ infix } IS NOT LINKED. No watcher will be started.`);
      }
    } else if (fs.existsSync(pkgAbsPath)) {
      log(`${ infix } IS INSTALLED. No local working copy exists, \`${ cyan(scriptName) }\` won't be run.`);
    } else {
      log(`${ infix } is NOT there. Ignoring.`);
    }
  });

