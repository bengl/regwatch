/*
Copyright 2015, Yahoo Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt
*/

var programName = require('./package').name;

var func;

var argv = require('yargs')
    .usage('Usage: ' + programName + ' [options]')
    .help('h')
    .alias('h', 'help')
    .describe('back', 'How far back in the feed to start')
    .default('back', 10)
    .describe('new', 'Only output for brand-new modules')
    .describe('format', 'How to display each change')
    .default('format', 'name')
    .describe('growl', 'Receive a growl notification for each change')
    .describe('cmd', 'A shell command to run for each change, where $CHANGE_ID is the module name')
    .alias('c', 'cmd')
    .describe('eval', 'JavaScript to evaluate for each change (`this` is the change object)')
    .alias('e', 'eval')
    .describe('eval-implicit-return', 'Like `eval`, but with an implicit `return ` before your code')
    .alias('E', 'eval-implicit-return')
    .describe('from-zero', 'Get changes starting at sequence 0')
    .alias('0', 'from-zero')
    .epilog('For more details, see `man ' + programName + '`.')
    .argv;

argv.stdout = process.stdout;
argv.stderr = process.stderr;

require('./lib/regwatch')(argv);
