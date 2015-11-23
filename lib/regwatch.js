/*
Copyright 2015, Yahoo Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt
*/

var request = require('request');
var growl = require('growl');
var exec = require('child_process').exec;
var Console = require('console').Console;

function getFormat(argv, console) {
    return {
        name: function(change, cb) {
            cb(null, change.id);
        },
        npmurl: function(change, cb) {
            cb(null, 'https://www.npmjs.com/package/' + change.id);
        },
        cmd: function(change, cb) {
            var env = {};
            Object.keys(process.env).forEach(function(k) {env[k] = process[k];});
            env.CHANGE_ID = change.id;
            env.CHANGE_REV = change.changes[0].rev;
            exec(argv.cmd, {
                env: env
            }, function(err, stdout, stderr){
                if (stderr && stderr.length > 0) {
                    console.error(stderr.toString());
                }
                console._stdout.write(stdout.toString());
                cb(err);
            });
        },
        eval: function(change, cb) {
            var split = change.changes[0].rev.split('-');
            var funcChange = {
                id: change.id,
                rev: {
                    toString: function(){
                        return this.num + '-' + this.hash;
                    },
                    num: split[0],
                    hash: split[1]
                }
            };
            funcChange.rev.num = split[0];
            funcChange.rev.hash = split[1];
            try {
                cb(null, argv.eval.call(funcChange));
            } catch (e) {
                cb(e);
            }
        }
    }[argv.format];
}

function makeStartFollow(console, argv) {
    var format = getFormat(argv, console);
    return function startFollow(err, data) {
        if (err) {
            throw err;
        }
        var opts = {url: 'https://skimdb.npmjs.com/registry'};
        if (data) {
            opts.since = data.body.update_seq - argv.back;
        }
        require('follow')(opts, function(err, change) {
            if (err) {
                console.error(err.stack);
            }

            processChange(change, console, format, argv);
        });
    }
}

function processChange(change, console, format, argv){
    var rev = change.changes[0].rev.split('-')[0];
    if (argv.new && rev != 1) {
        return;
    }
    if (argv.growl) {
        growl(change.id, {
            title: rev == 1 ? 'New npm Package' : 'Updated npm Package'
        });
    }
    format(change, function(err, data){
        if (data) {
            console.log(data);
        }
    });
}

module.exports = function run(argv) {
    var console = new Console(argv.stdout, argv.stderr);
    if (argv.cmd) {
        argv.format = 'cmd';
    }
    if (argv['eval-implicit-return']) {
        argv.eval = argv['eval-implicit-return'];
        argv.implicit = true;
    }
    if (argv.eval) {
        argv.format = 'eval';
        if (typeof argv.eval === 'string') {
            if (argv.implicit) {
                argv.eval = 'return ' + argv.eval;
            }
            argv.eval = new Function(argv.eval);
        }
    }
    if (argv['from-zero']) {
        makeStartFollow(console, argv)();
    } else {
        console.error('Getting sequence number..');
        request.get({
            url:'https://skimdb.npmjs.com/registry',
            json: true
        }, makeStartFollow(console, argv));
    }
}
