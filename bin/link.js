#!/usr/bin/env node

const fs = require('fs');
const {isLink} = require('fs-utils');
const {
  magenta,
  cyan,
  red,
  green,
} = require('colors');

const {name} = require('./package.json');
const config = require('rc')(name);

const path = require('path');
const pkg = require(path.resolve('./package.json'));
const log = require('../lib/log');
const isDependency = require('../lib/isDependencyOf')(pkg);

const npm = require('npm');

npm.load(pkg, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

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

      if (fs.existsSync(wcAbsPath)) {
        if (isLink(pkgAbsPath)) {
          log(`${ infix } IS ALREADY LINKED. Leaving as is.`);

          return;
        }

        log(`${ infix } WILL BE LINKED. It was found locally under ${ cyan(wcAbsPath) }`);

        npm.link(wcRelPath, (err) => {
          if (err) {
            log(`${ infix } LOCAL LINKING ${ red('FAILED') }.`);
          }

          log(`${ infix } LOCAL LINKING ${ green('DONE') }.`);
        });
      } else {
        if (isLink(pkgAbsPath)) {
          log(`${ infix } WILL BE UNLINKED. It no longer exists under ${ cyan(wcRelPath) }`);

          npm.unlink(locallyDevelopedDependencyName, (err) => {
            if (err) {
              log(`${ infix } LOCAL UNLINKING ${ red('FAILED') }.`);
              return;
            }

            log(`${ infix } LOCAL UNLINKING ${ green('DONE') }.`);
            log(`${ infix } Will now be installed.`);

            npm.install(locallyDevelopedDependencyName, (err) => {
              if (err) {
                log(`${ infix } INSTALL ${ red('FAILED') }.`);
                return;
              }

              log(`${ infix } INSTALL ${ green('DONE') }.`);
            })
          });
        } else if (fs.existsSync(pkgAbsPath)) {
          log(`${ infix } IS INSTALLED. No local working copy exists.`);
        } else {
          log(`${ infix } is NOT there. Ignoring.`);
        }
      }
    });
});

