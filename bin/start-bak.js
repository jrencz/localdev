#!/usr/bin/env node

const fs = require('fs');
const {isLink} = require('fs-utils');
const {
  magenta,
  cyan,
  red,
} = require('colors');

const pkg = require('../package.json');
const config = require('rc')(pkg.name);

const path = require('path');
const pkg = require(path.resolve('./package.json'));
const baseLog = require('../lib/log');
const isDependency = require('../lib/isDependencyOf');

const {spawn} = require('child_process');

const processPackage = (pkgName, __index, packages) => {
  const log = baseLog.bind(null, `pkg ${ magenta(pkgName) } `);

  // Note: only direct dependencies can be linked.
  const pkgAbsPath = path.resolve('./node_modules/', pkgName);
  const workingCopyPath = packages[pkgName];

  if (!workingCopyPath && isLink(pkgAbsPath)) {
    log(`was configured to be UNLINKED. Run \`link\` to unlink it.`);

    return;
  }

  const wcAbsPath = path.resolve(workingCopyPath);

  const scriptName = `${ name }-start`;

  if (fs.existsSync(wcAbsPath)) {
    if (isLink(pkgAbsPath)) {
      const wcPackageJsonAbsPath = path.resolve(wcAbsPath, './package.json');
      const wcPackageJson = require(wcPackageJsonAbsPath);

      if (scriptName in wcPackageJson.scripts) {
        log(`HAS \`${ cyan(scriptName) }\`. Starting.`);

        const localDevProcess = spawn('npm', ['run', scriptName], {
          cwd: wcAbsPath,
        });

        localDevProcess.stdout.on('data', data => {
          log(`from ${ magenta(pkgName) }`, data.toString());
        });

        localDevProcess.on('error', data => {
          log(`${ name } ${ red('PROBLEM') }`, data.toString());
        });

        localDevProcess.on('close', code => {
          log(`${ name } ${ red('EXITED') } with code`, code);
        });

        process.on('exit', () => {
          localDevProcess.kill();
        })
      } else {
        log(`HAS NO \`${ cyan(scriptName) }\`.`);
      }
    } else {
      log(`IS NOT LINKED. No watcher will be started.`);
    }
  } else if (fs.existsSync(pkgAbsPath)) {
    log(`IS INSTALLED. No local working copy exists, \`${ cyan(scriptName) }\` won't be run.`);
  } else {
    log(`is NOT there. Ignoring.`);
  }
};

Object
  .keys(config.packages)
  .filter(isDependency(pkg))
  .forEach(processPackage);

