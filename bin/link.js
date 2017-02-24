#!/usr/bin/env node

const pkg = require('../package.json');
const config = require('rc')(pkg.name);

const path = require('path');
const hostPkg = require(path.resolve('./package.json'));
const npm = require('npm');

const forEachOfDependencies = require('../lib/forEachOfDependencies');
const linkPackage = require('../lib/linkPackage');

const {
  compile: compileDependencies,
} = require('../lib/dependencies');

npm.load(hostPkg, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  forEachOfDependencies({
    compiler: compileDependencies,
    processor: linkPackage(npm),
    config,
  });

  // TODO: prune (npm unlink + npm i) all those that are no longer in compiled
  // config.
  // To achieve this it all has to be async.
});

