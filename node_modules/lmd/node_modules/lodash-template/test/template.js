/**
 * Original source
 * https://github.com/bestiejs/lodash/blob/v1.0.0-rc.3/test/test.js
 */

var template = require('../index'),
    assert = require('assert'),
    deepEqual = assert.deepEqual,
    ok = assert.ok,
    equal = assert.equal;

describe('lodash.template', function () {

    it('should not augment the `options` object', function() {
        var options = {};
        template('', null, options);
        deepEqual(options, {});
    });

    it('should provide the template source when a SyntaxError occurs', function() {
        try {
            template('<% if x %>');
        } catch(e) {
            var source = e.source;
        }
        ok(/__p/.test(source));
    });

    it('should work with complex "interpolate" delimiters', function() {
        var tests = {
            '<%= a + b %>': '3',
            '<%= b - a %>': '1',
            '<%= a = b %>': '2',
            '<%= !a %>': 'false',
            '<%= ~a %>': '-2',
            '<%= a * b %>': '2',
            '<%= a / b %>': '0.5',
            '<%= a % b %>': '1',
            '<%= a >> b %>': '0',
            '<%= a << b %>': '4',
            '<%= a & b %>': '0',
            '<%= a ^ b %>': '3',
            '<%= a | b %>': '3',
            '<%= {}.toString.call(0) %>': '[object Number]',
            '<%= a.toFixed(2) %>': '1.00',
            '<%= obj["a"] %>': '1',
            '<%= delete a %>': 'true',
            '<%= "a" in obj %>': 'true',
            '<%= obj instanceof Object %>': 'true',
            '<%= new Boolean %>': 'false',
            '<%= typeof a %>': 'number',
            '<%= void a %>': ''
        };

        Object.keys(tests).forEach(function (key) {
            var value = tests[key],
                compiled = template(key),
                data = { 'a': 1, 'b': 2 };

            equal(compiled(data), value, key);
        });
    });

    it('should allow referencing variables declared in "evaluate" delimiters from other delimiters', function() {
        var compiled = template('<% var b = a; %><%= b.value %>'),
            data = { 'a': { 'value': 1 } };

        equal(compiled(data), '1');
    });

    it('should work when passing `options.variable`', function() {
        var compiled = template(
            '<% data.a.forEach(function( value ) { %>' +
                '<%= value.valueOf() %>' +
                '<% }) %>', null, { 'variable': 'data' }
        );

        var data = { 'a': [1, 2, 3] };

        try {
            equal(compiled(data), '123');
        } catch(e) {
            ok(false);
        }
    });

    it('should not error with IE conditional comments enabled (test with development build)', function() {
        var compiled = template(''),
            pass = true;

        /*@cc_on @*/
        try {
            compiled();
        } catch(e) {
            pass = false;
        }
        ok(pass);
    });

    it('should tokenize delimiters', function() {
        var compiled = template('<span class="icon-<%= type %>2"></span>');
        equal(compiled({ 'type': 1 }), '<span class="icon-12"></span>');
    });

    it('should work with "interpolate" delimiters containing ternary operators', function() {
        var compiled = template('<%= value ? value : "b" %>');
        equal(compiled({ 'value': 'a' }), 'a');
    });

    it('should parse delimiters with newlines', function() {
        var expected = '<<\nprint("<p>" + (value ? "yes" : "no") + "</p>")\n>>',
            compiled = template(expected, null, { 'evaluate': /<<(.+?)>>/g });

        equal(compiled({ 'value': true }), expected);
    });

    it('should parse ES6 template delimiters', function() {
        var data = { 'value': 2 };
        equal(template('1${value}3', data), '123');
        equal(template('${"{" + value + "\\}"}', data), '{2}');
    });

});
