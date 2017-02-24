#!/usr/bin/env node

const pkg = require('../package.json');
const config = require('rc')(pkg.name);

const path = require('path');
const hostPkg = require(path.resolve('./package.json'));
const npm = require('npm');

const executeForPackages = require('../lib/executeForPackages');
const linkPackage = require('../lib/linkPackage');

npm.load(hostPkg, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  executeForPackages(linkPackage(npm), config);
});

