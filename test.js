var tap = require('tap');
var assert = require('assert');
var mockery = require('mockery');

var fakeChanges = [
{ seq: 486693,
    id: 'babel-plugin-preprocessor-directives',
    changes: [ { rev: '2-38c70085f108be89e008aedb3cd1bcc9' } ] },
{ seq: 486695,
    id: 'kayvee',
    changes: [ { rev: '10-043d88cce80b4db4f388ff8ab52b7279' } ] },
{ seq: 486696,
    id: 'mws-sdk-promises',
    changes: [ { rev: '5-0ee563006ec944477123b3d31b70577d' } ] },
{ seq: 486698,
    id: 'organization-service',
    changes: [ { rev: '19-98e77d047333249f0c11939b3ecece4c' } ] },
{ seq: 486699,
    id: 'gulp-salt',
    changes: [ { rev: '3-a5edd159fec64c70a6efdadd04efd063' } ] },
{ seq: 486701,
    id: 'wfm',
    changes: [ { rev: '14-abc5cb601e75636b4c6e177a8bd0bf87' } ] },
{ seq: 486702,
    id: 'fhirpath.js',
    changes: [ { rev: '4-3400045c1c24b59cfc3052cc8ba195d6' } ] },
{ seq: 486703,
    id: 'fortune',
    changes: [ { rev: '66-bab7a059652632b398bd59d632c0bd3d' } ] },
{ seq: 486704,
    id: 'react-pinterest',
    changes: [ { rev: '1-3518377fccc8db7cf287d456b8cb354d' } ] },
{ seq: 486705,
    id: 'memdb-server',
    changes: [ { rev: '9081-f66b51656760e83eb25309c1bf05431b' } ] },
{ seq: 486706,
    id: 'autoprefixer',
    changes: [ { rev: '29-5ede63c43cae2330a581d13240981488' } ] },
{ seq: 486708,
    id: 'cloudpirate',
    changes: [ { rev: '13-12462936cdbba27984f65261a951f636' } ] },
{ seq: 486709,
    id: 'flightplan',
    changes: [ { rev: '8-08da4c6b5e2e98c72ba8379edf044da8' } ] },
{ seq: 486710,
    id: 'htauth',
    changes: [ { rev: '1-4e85e770f08ba7f572e35c817b507d39' } ] },
{ seq: 486711,
    id: 'ipfs-event-stream',
    changes: [ { rev: '3-f176abb87c8408dc5cfeeff832bb40dd' } ] },
{ seq: 486712,
    id: 'postcss-assemble-core',
    changes: [ { rev: '3-cd9dca3aab5d36a04d4cb5fefc96fd0e' } ] }
];

var lastSinceValue, requestCalled;

var testErr = new Error('foo');
function fakeFollow (opts, cb) {
    assert.equal(opts.url, 'https://skimdb.npmjs.com/registry');
    lastSinceValue = opts.since;
    fakeChanges.forEach(function(change, i){
        cb(i == 0 ? testErr : null, change);
    });
}

var fakeRequest = {
    get: function(opts, fn) {
        requestCalled = true;
        assert.deepEqual(opts, {
            url:'https://skimdb.npmjs.com/registry',
            json: true
        });
        fn(null, {body:{update_seq: 486713}});
    }
};

var growls = [];
function fakeGrowl(id, opts){
    growls.push(id, opts);
}

var fakeChildOpts = [];
var fakeChild = {
    exec: function(cmd, opts, cb){
        opts.cmd = cmd;
        fakeChildOpts.push(opts);
        cb(null, 'fooOut', 'fooErr');
    }
};

function run(args) {
    args.stdout = {
        buff: '',
        write: function(x) {
            this.buff += x;
        }
    };

    args.stderr = {
        buff: '',
        write: function(x) {
            this.buff += x;
        }
    };
    require('./lib/regwatch')(args);
    return args;
}

mockery.registerMock('request', fakeRequest);
mockery.registerMock('follow', fakeFollow);
mockery.registerMock('growl', fakeGrowl);
mockery.registerMock('child_process', fakeChild);
mockery.enable({warnOnUnregistered: false});

tap.test('name, new, back, stderr', function(t) {
    requestCalled = false;
    var args = run({new: true, format: 'name', back: 10});
    t.equal(args.stdout.buff, 'react-pinterest\nhtauth\n');
    t.equal(args.stderr.buff, 'Getting sequence number..\n'+testErr.stack+'\n');
    t.equal(lastSinceValue, 486703);
    t.ok(requestCalled);
    t.end();
});

tap.test('npmurl', function(t) {
    requestCalled = false;
    var args = run({format: 'npmurl'});
    t.equal(args.stdout.buff, fakeChanges.map(function(x){
        return 'https://www.npmjs.com/package/' + x.id;
    }).join('\n')+'\n');
    t.ok(requestCalled);
    t.end();
});

tap.test('eval', function(t) {
    requestCalled = false;
    var args = run({eval:'return "foo"+this.id+this.rev'});
    t.equal(args.stdout.buff, fakeChanges.map(function(x){
        return 'foo' + x.id + x.changes[0].rev;
    }).join('\n')+'\n');
    t.ok(requestCalled);
    t.end();
});

tap.test('eval-implicit-return', function(t) {
    requestCalled = false;
    var args = run({'eval-implicit-return':'"foo"+this.id+this.rev'});
    t.equal(args.stdout.buff, fakeChanges.map(function(x){
        return 'foo' + x.id + x.changes[0].rev;
    }).join('\n')+'\n');
    t.ok(requestCalled);
    t.end();
});

tap.test('from-zero', function(t){
    requestCalled = false;
    var args = run({format: 'name', 'from-zero': true});
    t.equal(args.stdout.buff, fakeChanges.map(function(x){
        return x.id;
    }).join('\n')+'\n');
    t.equal(args.stderr.buff, testErr.stack+'\n');
    t.equal(lastSinceValue, undefined);
    t.notOk(requestCalled);
    t.end();
});

tap.test('cmd', function(t){
    var args = run({format: 'name', 'cmd': 'echo $CHANGE_ID $CHANGE_REV'});
    t.equal(args.stdout.buff, fakeChanges.map(function(x, i){
        t.equal(fakeChildOpts[i].cmd, 'echo $CHANGE_ID $CHANGE_REV');
        t.equal(fakeChildOpts[i].env.CHANGE_ID, x.id);
        t.equal(fakeChildOpts[i].env.CHANGE_REV, x.changes[0].rev);
        return 'fooOut';
    }).join(''));
    t.equal(args.stderr.buff, 'Getting sequence number..\n'+
            testErr.stack+'\n'+
            fakeChanges.map(function(x){
                return 'fooErr\n';
    }).join(''));
    t.end();
});

tap.test('growl', function(t){
    growls = [];
    var args = run({format: 'name', growl: true});
    t.deepEqual(growls, [
        'babel-plugin-preprocessor-directives',
        { title: 'Updated npm Package' },
        'kayvee',
        { title: 'Updated npm Package' },
        'mws-sdk-promises',
        { title: 'Updated npm Package' },
        'organization-service',
        { title: 'Updated npm Package' },
        'gulp-salt',
        { title: 'Updated npm Package' },
        'wfm',
        { title: 'Updated npm Package' },
        'fhirpath.js',
        { title: 'Updated npm Package' },
        'fortune',
        { title: 'Updated npm Package' },
        'react-pinterest',
        { title: 'New npm Package' },
        'memdb-server',
        { title: 'Updated npm Package' },
        'autoprefixer',
        { title: 'Updated npm Package' },
        'cloudpirate',
        { title: 'Updated npm Package' },
        'flightplan',
        { title: 'Updated npm Package' },
        'htauth',
        { title: 'New npm Package' },
        'ipfs-event-stream',
        { title: 'Updated npm Package' },
        'postcss-assemble-core',
        { title: 'Updated npm Package' }
    ]);
    t.end();
});
