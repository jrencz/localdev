#!/usr/bin/env node

const fs = require('fs');
const {isLink} = require('fs-utils');
const {
  magenta,
  cyan,
  red,
} = require('colors');

const {name} = require('./package.json');
const config = require('rc')(name);

const path = require('path');
const pkg = require(path.resolve('./package.json'));
const log = require('../lib/log');
const isDependency = require('../lib/isDependencyOf')(pkg);

const {spawn} = require('child_process');

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

    const scriptName = `${ name }-start`;

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
            log(`${ infix } ${ name } ${ red('PROBLEM') }`, data.toString());
          });

          localDevProcess.on('close', code => {
            log(`${ infix } ${ name } ${ red('EXITED') } with code`, code);
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

