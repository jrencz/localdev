#!/usr/bin/env node

const pkg = require('../package.json');
const config = require('rc')(pkg.name);

const forEachOfDependencies = require('../lib/forEachOfDependencies');
const startHook = require('../lib/startHook');

forEachOfDependencies(startHook, config);
