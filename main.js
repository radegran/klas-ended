#!/bin/env node

var server = require('./server/server');

/**
 *  main():  Main code.
 */
var zapp = new server.SampleApp();
zapp.initialize();
zapp.start();

