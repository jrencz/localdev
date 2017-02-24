#!/usr/bin/env node

const pkg = require('../package.json');
const config = require('rc')(pkg.name);

const executeForPackages = require('../lib/executeForPackages');
const startHook = require('../lib/startHook');

executeForPackages(startHook, config);
