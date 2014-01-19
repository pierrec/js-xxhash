/**
 * @license
 * (c) 2012 Mikhail Davydov <http://azproduction.ru>
 * Lo-Dash 1.0.0-rc.3 <http://lodash.com>
 * (c) 2012 John-David Dalton <http://allyoucanleet.com/>
 * Based on Underscore.js 1.4.3 <http://underscorejs.org>
 * (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to detect template delimiter values that require a with-statement */
var reComplexDelimiter = /[-?+=!~*%&^<>|{(\/]|\[\D|\b(?:delete|in|instanceof|new|typeof|void)\b/;

/** Used to match empty string literals in compiled template source */
var reEmptyStringLeading = /\b__p \+= '';/g,
    reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
    reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

/** Used to insert the data object variable into compiled template source */
var reInsertVariable = /(?:__e|__t = )\(\s*(?![\d\s"']|this\.)/g;

/**
 * Used to match ES6 template delimiters
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-7.8.6
 */
var reEsTemplate = /\$\{((?:(?=\\?)\\?[\s\S])*?)}/g;

/** Used to match "interpolate" template delimiters */
var reInterpolate = /<%=([\s\S]+?)%>/g;

/** Used to ensure capturing order of template delimiters */
var reNoMatch = /($^)/;

/** Used to match HTML characters */
var reUnescapedHtml = /[&<>"']/g;

/** Used to match unescaped characters in compiled string literals */
var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

var settings = {

    /**
     * Used to detect `data` property values to be HTML-escaped.
     *
     * @memberOf settings
     * @type RegExp
     */
    'escape': /<%-([\s\S]+?)%>/g,

    /**
     * Used to detect code to be evaluated.
     *
     * @memberOf settings
     * @type RegExp
     */
    'evaluate': /<%([\s\S]+?)%>/g,

    /**
     * Used to detect `data` property values to inject.
     *
     * @memberOf settings
     * @type RegExp
     */
    'interpolate': reInterpolate,

    /**
     * Used to reference the data object in the template text.
     *
     * @memberOf settings
     * @type String
     */
    'variable': '',

    /**
     * Used to import variables into the compiled template.
     *
     * @memberOf settings
     * @type Object
     */
    'imports': {
        '__e': escape
    }
};

/** Used to escape characters for inclusion in compiled string literals */
var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
};

/**
 * Used to convert characters to HTML entities:
 *
 * Though the `>` character is escaped for symmetry, characters like `>` and `/`
 * don't require escaping in HTML and have no special meaning unless they're part
 * of a tag or an unquoted attribute value.
 * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
 */
var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
};

var keys = Object.keys;

/**
 * Creates an array composed of the own enumerable property values of `object`.
 *
 * @static
 * @category Objects
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns a new array of property values.
 * @example
 *
 * values({ 'one': 1, 'two': 2, 'three': 3 });
 * // => [1, 2, 3]
 */
function values(object) {
    var index = -1,
        props = keys(object),
        length = props.length,
        result = Array(length);

    while (++index < length) {
        result[index] = object[props[index]];
    }
    return result;
}

/**
 * Used by `template` to escape characters for inclusion in compiled
 * string literals.
 *
 * @private
 * @param {String} match The matched character to escape.
 * @returns {String} Returns the escaped character.
 */
function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
}

// Fill in a given object with default properties.
function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
        if (source) {
            for (var prop in source) {
                if (obj[prop] == null) obj[prop] = source[prop];
            }
        }
    });

    return obj;
}

/**
 * Used by `escape` to convert characters to HTML entities.
 *
 * @private
 * @param {String} match The matched character to escape.
 * @returns {String} Returns the escaped character.
 */
function escapeHtmlChar(match) {
    return htmlEscapes[match];
}

/**
 * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
 * corresponding HTML entities.
 *
 * @static
 * @category Utilities
 * @param {String} string The string to escape.
 * @returns {String} Returns the escaped string.
 * @example
 *
 * _.escape('Moe, Larry & Curly');
 * // => 'Moe, Larry &amp; Curly'
 */
function escape(string) {
    return string == null ? '' : (string + '').replace(reUnescapedHtml, escapeHtmlChar);
}

/**
 * A micro-templating method that handles arbitrary delimiters, preserves
 * whitespace, and correctly escapes quotes within interpolated code.
 *
 * Note: In the development build `_.template` utilizes sourceURLs for easier
 * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
 *
 * Note: Lo-Dash may be used in Chrome extensions by either creating a `lodash csp`
 * build and avoiding `_.template` use, or loading Lo-Dash in a sandboxed page.
 * See http://developer.chrome.com/trunk/extensions/sandboxingEval.html
 *
 * @static
 * @category Utilities
 * @param {String} text The template text.
 * @param {Obect} data The data object used to populate the text.
 * @param {Object} options The options object.
 *  escape - The "escape" delimiter regexp.
 *  evaluate - The "evaluate" delimiter regexp.
 *  interpolate - The "interpolate" delimiter regexp.
 *  sourceURL - The sourceURL of the template's compiled source.
 *  variable - The data object variable name.
 *
 * @returns {Function|String} Returns a compiled function when no `data` object
 *  is given, else it returns the interpolated text.
 * @example
 *
 * // using a compiled template
 * var compiled = _.template('hello <%= name %>');
 * compiled({ 'name': 'moe' });
 * // => 'hello moe'
 *
 * var list = '<% _.forEach(people, function(name) { %><li><%= name %></li><% }); %>';
 * _.template(list, { 'people': ['moe', 'larry', 'curly'] });
 * // => '<li>moe</li><li>larry</li><li>curly</li>'
 *
 * // using the "escape" delimiter to escape HTML in data property values
 * _.template('<b><%- value %></b>', { 'value': '<script>' });
 * // => '<b>&lt;script&gt;</b>'
 *
 * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
 * _.template('hello ${ name }', { 'name': 'curly' });
 * // => 'hello curly'
 *
 * // using the internal `print` function in "evaluate" delimiters
 * _.template('<% print("hello " + epithet); %>!', { 'epithet': 'stooge' });
 * // => 'hello stooge!'
 *
 * // using custom template delimiters
 * _.templateSettings = {
   *   'interpolate': /{{([\s\S]+?)}}/g
   * };
 *
 * _.template('hello {{ name }}!', { 'name': 'mustache' });
 * // => 'hello mustache!'
 *
 * // using the `sourceURL` option to specify a custom sourceURL for the template
 * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
 * compiled(data);
 * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
 *
 * // using the `variable` option to ensure a with-statement isn't used in the compiled template
 * var compiled = _.template('hello <%= data.name %>!', null, { 'variable': 'data' });
 * compiled.source;
 * // => function(data) {
   *   var __t, __p = '', __e = _.escape;
   *   __p += 'hello ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
   *   return __p;
   * }
 *
 * // using the `source` property to inline compiled templates for meaningful
 * // line numbers in error messages and a stack trace
 * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
 *   var JST = {\
   *     "main": ' + _.template(mainText).source + '\
   *   };\
 * ');
 */
function template(text, data, options) {
    // based on John Resig's `tmpl` implementation
    // http://ejohn.org/blog/javascript-micro-templating/
    // and Laura Doktorova's doT.js
    // https://github.com/olado/doT
    text || (text = '');

    options = defaults({}, options, settings);

    var imports = defaults({}, options.imports, settings.imports),
        importsKeys = keys(imports),
        importsValues = values(imports);

    var index = 0,
        interpolate = options.interpolate || reNoMatch,
        isEvaluating = false,
        source = "__p += '";

    // compile regexp to match each delimiter
    var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
            interpolate.source + '|' +
            (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
            (options.evaluate || reNoMatch).source + '|$'
        , 'g');

    text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
            source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
            source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
            source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        isEvaluating || (isEvaluating = evaluateValue || reComplexDelimiter.test(escapeValue || interpolateValue));
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
    });

    source += "';\n";

    // if `variable` is not specified and the template contains "evaluate"
    // delimiters, wrap a with-statement around the generated code to add the
    // data object to the top of the scope chain
    var variable = options.variable,
        hasVariable = variable;

    if (!hasVariable) {
        variable = 'obj';
        if (isEvaluating) {
            source = 'with (' + variable + ') {\n' + source + '\n}\n';
        }
        else {
            // avoid a with-statement by prepending data object references to property names
            var reDoubleVariable = RegExp('(\\(\\s*)' + variable + '\\.' + variable + '\\b', 'g');
            source = source
                .replace(reInsertVariable, '$&' + variable + '.')
                .replace(reDoubleVariable, '$1__d');
        }
    }

    // cleanup code by stripping empty strings
    source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

    // frame code as the function body
    source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = ''" +
        (isEvaluating
            ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
            : (hasVariable ? '' : ', __d = ' + variable + '.' + variable + ' || ' + variable) + ';\n'
            ) +
        source +
        'return __p\n}';

    try {
        var result = Function(importsKeys, 'return ' + source).apply(void 0, importsValues);
    } catch(e) {
        e.source = source;
        throw e;
    }
    if (data) {
        return result(data);
    }
    // provide the compiled function's source via its `toString` method, in
    // supported environments, or the `source` property as a convenience for
    // inlining compiled templates during the build process
    result.source = source;
    return result;
}


module.exports = template;
module.exports.settings = settings;
