/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var once = require('once');

var libmanta = require('../lib');


if (require.cache[__dirname + '/helper.js'])
    delete require.cache[__dirname + '/helper.js'];
var helper = require('./helper.js');


///--- Globals

var after = helper.after;
var before = helper.before;
var test = helper.test;



///--- Tests

before(function (cb) {
    cb = once(cb);

    if (!process.env.MAHI_HOST) {
        cb(new Error('MAHI_HOST not set in environment'));
        return;
    }

    var opts = {
        host: process.env.MAHI_HOST,
        log: helper.createLogger()
    };
    this.mahi = libmanta.createMahiClient(opts);
    this.mahi.once('error', cb);
    this.mahi.once('connect', cb);
});


after(function (cb) {
    if (this.mahi) {
        this.mahi.once('close', cb);
        this.mahi.close();
    } else {
        cb();
    }
});


test('load user by login', function (t) {
    this.mahi.userFromLogin('poseidon', function (err, user) {
        t.ifError(err);
        t.ok(user);
        if (user) {
            t.ok(user.uuid);
            t.ok(Array.isArray(user.groups));
            t.ok(user.keys);
            t.equal(user.login, 'poseidon');
        }
        t.end();
    });
});


test('load user not found', function (t) {
    this.mahi.userFromLogin('a', function (err, user) {
        t.ok(err);
        t.notOk(user);
        if (err) {
            t.equal(err.name, 'UserDoesNotExistError');
            t.ok(err.message);
        }
        t.end();
    });
});


test('load user by uuid', function (t) {
    var self = this;

    this.mahi.userFromLogin('poseidon', function (err, user) {
        t.ifError(err);
        t.ok(user);
        if (!user) {
            t.end();
            return;
        }

        self.mahi.userFromUUID(user.uuid, function (err2, user2) {
            t.ifError(err2);
            t.ok(user2);
            if (!user2) {
                t.end();
                return;
            }
            t.deepEqual(user, user2);
            t.end();
        });
    });
});


test('load user by uuid not found', function (t) {
    this.mahi.userFromUUID('a', function (err, user) {
        t.ok(err);
        t.notOk(user);
        if (err) {
            t.equal(err.name, 'UserDoesNotExistError');
            t.ok(err.message);
        }
        t.end();
    });
});


test('toString', function (t) {
    var s = this.mahi.toString();
    t.equal(s, '[object MahiClient <tcp://' +
            process.env.MAHI_HOST +
            ':6379>]');
    t.end();
});


test('set members', function (t) {
    this.mahi.setMembers('uuid', function (err, uuids) {
        t.ifError(err);
        t.ok(uuids.length > 0);
        t.end();
    });
});


test('empty set or set not found', function (t) {
    this.mahi.setMembers('a', function (err, uuids) {
        t.ok(err);
        t.notOk(uuids);
        if (err) {
            t.equal(err.name, 'EmptySetError');
            t.ok(err.message);
        }
        t.end();
    });
});
