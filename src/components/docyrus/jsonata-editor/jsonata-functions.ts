// @ts-nocheck
/* eslint-disable */
import { type JsonataFunction } from './jsonata-editor-types'

const DOCS = 'https://docs.jsonata.org'

/**
 * Catalog of JSONata built-in functions, used to power autocomplete, hover
 * tooltips and signature help. Adapted from the JSONata documentation.
 */
export const JSONATA_FUNCTIONS: JsonataFunction[] = [
  {
    name: '$string',
    signature: '$string(arg, prettify?)',
    category: 'String',
    description:
      'Casts the argument to a string. If prettify is true, "prettifies" JSON objects with indentation.',
    params: [
      { name: 'arg', type: 'any', description: 'Value to convert to string' },
      {
        name: 'prettify',
        type: 'boolean',
        optional: true,
        description: 'Pretty print JSON objects',
      },
    ],
    returns: 'string',
    examples: ['$string(5) /* "5" */', '$string({"a": 1}, true)'],
    docsUrl: `${DOCS}/string-functions#string`,
  },
  {
    name: '$length',
    signature: '$length(str)',
    category: 'String',
    description: 'Returns the number of characters in the string.',
    params: [{ name: 'str', type: 'string', description: 'Input string' }],
    returns: 'number',
    examples: ['$length("Hello") /* 5 */'],
    docsUrl: `${DOCS}/string-functions#length`,
  },
  {
    name: '$substring',
    signature: '$substring(str, start, length?)',
    category: 'String',
    description:
      'Returns a substring of str starting at start position (zero-indexed) with optional length.',
    params: [
      { name: 'str', type: 'string', description: 'Input string' },
      {
        name: 'start',
        type: 'number',
        description: 'Starting position (0-indexed)',
      },
      {
        name: 'length',
        type: 'number',
        optional: true,
        description: 'Length of substring',
      },
    ],
    returns: 'string',
    examples: [
      '$substring("Hello World", 6) /* "World" */',
      '$substring("Hello", 0, 2) /* "He" */',
    ],
    docsUrl: `${DOCS}/string-functions#substring`,
  },
  {
    name: '$substringBefore',
    signature: '$substringBefore(str, chars)',
    category: 'String',
    description: 'Returns the substring before the first occurrence of chars.',
    params: [
      { name: 'str', type: 'string', description: 'Input string' },
      {
        name: 'chars',
        type: 'string',
        description: 'Characters to search for',
      },
    ],
    returns: 'string',
    examples: ['$substringBefore("hello@example.com", "@") /* "hello" */'],
    docsUrl: `${DOCS}/string-functions#substringbefore`,
  },
  {
    name: '$substringAfter',
    signature: '$substringAfter(str, chars)',
    category: 'String',
    description: 'Returns the substring after the first occurrence of chars.',
    params: [
      { name: 'str', type: 'string', description: 'Input string' },
      {
        name: 'chars',
        type: 'string',
        description: 'Characters to search for',
      },
    ],
    returns: 'string',
    examples: ['$substringAfter("hello@example.com", "@") /* "example.com" */'],
    docsUrl: `${DOCS}/string-functions#substringafter`,
  },
  {
    name: '$uppercase',
    signature: '$uppercase(str)',
    category: 'String',
    description: 'Converts all characters in str to uppercase.',
    params: [{ name: 'str', type: 'string', description: 'Input string' }],
    returns: 'string',
    examples: ['$uppercase("hello") /* "HELLO" */'],
    docsUrl: `${DOCS}/string-functions#uppercase`,
  },
  {
    name: '$lowercase',
    signature: '$lowercase(str)',
    category: 'String',
    description: 'Converts all characters in str to lowercase.',
    params: [{ name: 'str', type: 'string', description: 'Input string' }],
    returns: 'string',
    examples: ['$lowercase("HELLO") /* "hello" */'],
    docsUrl: `${DOCS}/string-functions#lowercase`,
  },
  {
    name: '$trim',
    signature: '$trim(str)',
    category: 'String',
    description: 'Normalizes and trims all whitespace characters in str.',
    params: [{ name: 'str', type: 'string', description: 'Input string' }],
    returns: 'string',
    examples: ['$trim("  hello  world  ") /* "hello world" */'],
    docsUrl: `${DOCS}/string-functions#trim`,
  },
  {
    name: '$pad',
    signature: '$pad(str, width, char?)',
    category: 'String',
    description:
      'Pads str to width characters; a negative width pads on the right.',
    params: [
      { name: 'str', type: 'string', description: 'Input string' },
      {
        name: 'width',
        type: 'number',
        description: 'Target width (negative pads right)',
      },
      {
        name: 'char',
        type: 'string',
        optional: true,
        description: 'Padding character (default: space)',
      },
    ],
    returns: 'string',
    examples: [
      '$pad("foo", -5) /* "foo  " */',
      '$pad("5", 3, "0") /* "005" */',
    ],
    docsUrl: `${DOCS}/string-functions#pad`,
  },
  {
    name: '$contains',
    signature: '$contains(str, pattern)',
    category: 'String',
    description: 'Returns true if str contains pattern (a string or regex).',
    params: [
      { name: 'str', type: 'string', description: 'Input string' },
      {
        name: 'pattern',
        type: 'string | regex',
        description: 'Pattern to search for',
      },
    ],
    returns: 'boolean',
    examples: ['$contains("hello world", "world") /* true */'],
    docsUrl: `${DOCS}/string-functions#contains`,
  },
  {
    name: '$split',
    signature: '$split(str, separator, limit?)',
    category: 'String',
    description: 'Splits str into an array of strings using separator.',
    params: [
      { name: 'str', type: 'string', description: 'Input string' },
      {
        name: 'separator',
        type: 'string | regex',
        description: 'Separator pattern',
      },
      {
        name: 'limit',
        type: 'number',
        optional: true,
        description: 'Maximum number of splits',
      },
    ],
    returns: 'array',
    examples: ['$split("a,b,c", ",") /* ["a", "b", "c"] */'],
    docsUrl: `${DOCS}/string-functions#split`,
  },
  {
    name: '$join',
    signature: '$join(array, separator?)',
    category: 'String',
    description:
      'Joins an array of strings into a single string with an optional separator.',
    params: [
      { name: 'array', type: 'array', description: 'Array of strings' },
      {
        name: 'separator',
        type: 'string',
        optional: true,
        description: 'Separator string',
      },
    ],
    returns: 'string',
    examples: ['$join(["a", "b", "c"], ",") /* "a,b,c" */'],
    docsUrl: `${DOCS}/string-functions#join`,
  },
  {
    name: '$match',
    signature: '$match(str, pattern, limit?)',
    category: 'String',
    description:
      'Matches str against a regex pattern and returns an array of match objects.',
    params: [
      { name: 'str', type: 'string', description: 'Input string' },
      {
        name: 'pattern',
        type: 'regex',
        description: 'Regular expression pattern',
      },
      {
        name: 'limit',
        type: 'number',
        optional: true,
        description: 'Maximum matches',
      },
    ],
    returns: 'array',
    examples: ['$match("ababab", /ab/)'],
    docsUrl: `${DOCS}/string-functions#match`,
  },
  {
    name: '$replace',
    signature: '$replace(str, pattern, replacement, limit?)',
    category: 'String',
    description: 'Replaces occurrences of pattern in str with replacement.',
    params: [
      { name: 'str', type: 'string', description: 'Input string' },
      {
        name: 'pattern',
        type: 'string | regex',
        description: 'Pattern to replace',
      },
      {
        name: 'replacement',
        type: 'string | function',
        description: 'Replacement string or function',
      },
      {
        name: 'limit',
        type: 'number',
        optional: true,
        description: 'Maximum replacements',
      },
    ],
    returns: 'string',
    examples: ['$replace("hello world", "world", "there") /* "hello there" */'],
    docsUrl: `${DOCS}/string-functions#replace`,
  },
  {
    name: '$eval',
    signature: '$eval(expr, context?)',
    category: 'String',
    description:
      'Parses and runs a string which contains a JSONata expression.',
    params: [
      {
        name: 'expr',
        type: 'string',
        description: 'JSONata expression to run',
      },
      {
        name: 'context',
        type: 'any',
        optional: true,
        description: 'Context for the run',
      },
    ],
    returns: 'any',
    examples: ['$eval("[1,2,3]")'],
    docsUrl: `${DOCS}/string-functions#eval`,
  },
  {
    name: '$base64encode',
    signature: '$base64encode(str)',
    category: 'String',
    description: 'Converts an ASCII string to a base 64 representation.',
    params: [{ name: 'str', type: 'string', description: 'String to encode' }],
    returns: 'string',
    examples: ['$base64encode("hello") /* "aGVsbG8=" */'],
    docsUrl: `${DOCS}/string-functions#base64encode`,
  },
  {
    name: '$base64decode',
    signature: '$base64decode(str)',
    category: 'String',
    description:
      'Converts a base 64 encoded string back to its original representation.',
    params: [
      { name: 'str', type: 'string', description: 'Base 64 string to decode' },
    ],
    returns: 'string',
    examples: ['$base64decode("aGVsbG8=") /* "hello" */'],
    docsUrl: `${DOCS}/string-functions#base64decode`,
  },
  {
    name: '$encodeUrlComponent',
    signature: '$encodeUrlComponent(str)',
    category: 'String',
    description: 'Encodes a URI component by escaping special characters.',
    params: [{ name: 'str', type: 'string', description: 'String to encode' }],
    returns: 'string',
    examples: ['$encodeUrlComponent("?x=test") /* "%3Fx%3Dtest" */'],
    docsUrl: `${DOCS}/string-functions#encodeurlcomponent`,
  },
  {
    name: '$encodeUrl',
    signature: '$encodeUrl(str)',
    category: 'String',
    description: 'Encodes a complete URI by escaping special characters.',
    params: [{ name: 'str', type: 'string', description: 'String to encode' }],
    returns: 'string',
    examples: ['$encodeUrl("https://example.com/?q=a b")'],
    docsUrl: `${DOCS}/string-functions#encodeurl`,
  },
  {
    name: '$decodeUrlComponent',
    signature: '$decodeUrlComponent(str)',
    category: 'String',
    description:
      'Decodes a URI component previously created by $encodeUrlComponent.',
    params: [
      { name: 'str', type: 'string', description: 'Encoded string to decode' },
    ],
    returns: 'string',
    examples: ['$decodeUrlComponent("%3Fx%3Dtest") /* "?x=test" */'],
    docsUrl: `${DOCS}/string-functions#decodeurlcomponent`,
  },
  {
    name: '$decodeUrl',
    signature: '$decodeUrl(str)',
    category: 'String',
    description: 'Decodes a complete URI previously created by $encodeUrl.',
    params: [
      { name: 'str', type: 'string', description: 'Encoded URL to decode' },
    ],
    returns: 'string',
    examples: ['$decodeUrl("https%3A%2F%2Fexample.com")'],
    docsUrl: `${DOCS}/string-functions#decodeurl`,
  },

  {
    name: '$number',
    signature: '$number(arg)',
    category: 'Numeric',
    description: 'Casts the argument to a number.',
    params: [
      { name: 'arg', type: 'any', description: 'Value to convert to number' },
    ],
    returns: 'number',
    examples: ['$number("5") /* 5 */', '$number(true) /* 1 */'],
    docsUrl: `${DOCS}/numeric-functions#number`,
  },
  {
    name: '$abs',
    signature: '$abs(number)',
    category: 'Numeric',
    description: 'Returns the absolute value of number.',
    params: [{ name: 'number', type: 'number', description: 'Input number' }],
    returns: 'number',
    examples: ['$abs(-5) /* 5 */'],
    docsUrl: `${DOCS}/numeric-functions#abs`,
  },
  {
    name: '$floor',
    signature: '$floor(number)',
    category: 'Numeric',
    description: 'Returns number rounded down to the nearest integer.',
    params: [{ name: 'number', type: 'number', description: 'Input number' }],
    returns: 'number',
    examples: ['$floor(5.7) /* 5 */'],
    docsUrl: `${DOCS}/numeric-functions#floor`,
  },
  {
    name: '$ceil',
    signature: '$ceil(number)',
    category: 'Numeric',
    description: 'Returns number rounded up to the nearest integer.',
    params: [{ name: 'number', type: 'number', description: 'Input number' }],
    returns: 'number',
    examples: ['$ceil(5.3) /* 6 */'],
    docsUrl: `${DOCS}/numeric-functions#ceil`,
  },
  {
    name: '$round',
    signature: '$round(number, precision?)',
    category: 'Numeric',
    description:
      'Rounds number to precision decimal places using "round half to even".',
    params: [
      { name: 'number', type: 'number', description: 'Number to round' },
      {
        name: 'precision',
        type: 'number',
        optional: true,
        description: 'Decimal places (default: 0)',
      },
    ],
    returns: 'number',
    examples: ['$round(3.14159, 2) /* 3.14 */'],
    docsUrl: `${DOCS}/numeric-functions#round`,
  },
  {
    name: '$power',
    signature: '$power(base, exponent)',
    category: 'Numeric',
    description: 'Returns base raised to the power of exponent.',
    params: [
      { name: 'base', type: 'number', description: 'Base number' },
      { name: 'exponent', type: 'number', description: 'Exponent' },
    ],
    returns: 'number',
    examples: ['$power(2, 3) /* 8 */'],
    docsUrl: `${DOCS}/numeric-functions#power`,
  },
  {
    name: '$sqrt',
    signature: '$sqrt(number)',
    category: 'Numeric',
    description: 'Returns the square root of number.',
    params: [{ name: 'number', type: 'number', description: 'Input number' }],
    returns: 'number',
    examples: ['$sqrt(16) /* 4 */'],
    docsUrl: `${DOCS}/numeric-functions#sqrt`,
  },
  {
    name: '$random',
    signature: '$random()',
    category: 'Numeric',
    description:
      'Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).',
    params: [],
    returns: 'number',
    examples: ['$random()'],
    docsUrl: `${DOCS}/numeric-functions#random`,
  },
  {
    name: '$formatNumber',
    signature: '$formatNumber(number, picture, options?)',
    category: 'Numeric',
    description:
      'Formats a number using a picture string (decimal format pattern).',
    params: [
      { name: 'number', type: 'number', description: 'Number to format' },
      { name: 'picture', type: 'string', description: 'Format pattern' },
      {
        name: 'options',
        type: 'object',
        optional: true,
        description: 'Formatting options',
      },
    ],
    returns: 'string',
    examples: ['$formatNumber(12345.67, "#,###.00") /* "12,345.67" */'],
    docsUrl: `${DOCS}/numeric-functions#formatnumber`,
  },
  {
    name: '$formatBase',
    signature: '$formatBase(number, radix?)',
    category: 'Numeric',
    description: 'Converts number to a string in the specified radix (base).',
    params: [
      { name: 'number', type: 'number', description: 'Number to convert' },
      {
        name: 'radix',
        type: 'number',
        optional: true,
        description: 'Base (2-36, default: 10)',
      },
    ],
    returns: 'string',
    examples: [
      '$formatBase(100, 2) /* "1100100" */',
      '$formatBase(255, 16) /* "ff" */',
    ],
    docsUrl: `${DOCS}/numeric-functions#formatbase`,
  },
  {
    name: '$formatInteger',
    signature: '$formatInteger(number, picture)',
    category: 'Numeric',
    description: 'Formats an integer using a picture string.',
    params: [
      { name: 'number', type: 'number', description: 'Integer to format' },
      {
        name: 'picture',
        type: 'string',
        description: 'Format pattern (e.g. "1", "i", "I", "w")',
      },
    ],
    returns: 'string',
    examples: [
      '$formatInteger(5, "i") /* "v" */',
      '$formatInteger(12, "w") /* "twelve" */',
    ],
    docsUrl: `${DOCS}/numeric-functions#formatinteger`,
  },
  {
    name: '$parseInteger',
    signature: '$parseInteger(str, picture)',
    category: 'Numeric',
    description:
      'Parses the contents of a string to an integer using a picture string.',
    params: [
      { name: 'str', type: 'string', description: 'String to parse' },
      { name: 'picture', type: 'string', description: 'Format pattern' },
    ],
    returns: 'number',
    examples: ['$parseInteger("twelve", "w") /* 12 */'],
    docsUrl: `${DOCS}/numeric-functions#parseinteger`,
  },

  {
    name: '$sum',
    signature: '$sum(array)',
    category: 'Aggregation',
    description: 'Returns the arithmetic sum of an array of numbers.',
    params: [{ name: 'array', type: 'array', description: 'Array of numbers' }],
    returns: 'number',
    examples: ['$sum([1, 2, 3, 4]) /* 10 */'],
    docsUrl: `${DOCS}/aggregation-functions#sum`,
  },
  {
    name: '$max',
    signature: '$max(array)',
    category: 'Aggregation',
    description: 'Returns the maximum number in an array of numbers.',
    params: [{ name: 'array', type: 'array', description: 'Array of numbers' }],
    returns: 'number',
    examples: ['$max([1, 5, 3, 9, 2]) /* 9 */'],
    docsUrl: `${DOCS}/aggregation-functions#max`,
  },
  {
    name: '$min',
    signature: '$min(array)',
    category: 'Aggregation',
    description: 'Returns the minimum number in an array of numbers.',
    params: [{ name: 'array', type: 'array', description: 'Array of numbers' }],
    returns: 'number',
    examples: ['$min([1, 5, 3, 9, 2]) /* 1 */'],
    docsUrl: `${DOCS}/aggregation-functions#min`,
  },
  {
    name: '$average',
    signature: '$average(array)',
    category: 'Aggregation',
    description: 'Returns the mean value of an array of numbers.',
    params: [{ name: 'array', type: 'array', description: 'Array of numbers' }],
    returns: 'number',
    examples: ['$average([1, 2, 3, 4]) /* 2.5 */'],
    docsUrl: `${DOCS}/aggregation-functions#average`,
  },

  {
    name: '$boolean',
    signature: '$boolean(arg)',
    category: 'Boolean',
    description:
      'Casts the argument to a Boolean using JSONata truthiness rules.',
    params: [
      { name: 'arg', type: 'any', description: 'Value to convert to boolean' },
    ],
    returns: 'boolean',
    examples: ['$boolean(1) /* true */', '$boolean("") /* false */'],
    docsUrl: `${DOCS}/boolean-functions#boolean`,
  },
  {
    name: '$not',
    signature: '$not(arg)',
    category: 'Boolean',
    description: 'Returns the logical NOT of the argument.',
    params: [{ name: 'arg', type: 'boolean', description: 'Boolean value' }],
    returns: 'boolean',
    examples: ['$not(true) /* false */'],
    docsUrl: `${DOCS}/boolean-functions#not`,
  },
  {
    name: '$exists',
    signature: '$exists(arg)',
    category: 'Boolean',
    description:
      'Returns true if the argument value evaluates to a defined value.',
    params: [{ name: 'arg', type: 'any', description: 'Value to check' }],
    returns: 'boolean',
    examples: ['$exists(foo) /* true if foo is defined */'],
    docsUrl: `${DOCS}/boolean-functions#exists`,
  },

  {
    name: '$count',
    signature: '$count(array)',
    category: 'Array',
    description: 'Returns the number of items in the array.',
    params: [{ name: 'array', type: 'array', description: 'Input array' }],
    returns: 'number',
    examples: ['$count([1, 2, 3]) /* 3 */'],
    docsUrl: `${DOCS}/array-functions#count`,
  },
  {
    name: '$append',
    signature: '$append(array1, array2)',
    category: 'Array',
    description: 'Appends array2 to the end of array1.',
    params: [
      { name: 'array1', type: 'array', description: 'First array' },
      { name: 'array2', type: 'array', description: 'Second array' },
    ],
    returns: 'array',
    examples: ['$append([1, 2], [3, 4]) /* [1, 2, 3, 4] */'],
    docsUrl: `${DOCS}/array-functions#append`,
  },
  {
    name: '$sort',
    signature: '$sort(array, function?)',
    category: 'Array',
    description:
      'Returns a sorted array, optionally using a comparator function.',
    params: [
      { name: 'array', type: 'array', description: 'Array to sort' },
      {
        name: 'function',
        type: 'function',
        optional: true,
        description: 'Comparator (returns true to swap)',
      },
    ],
    returns: 'array',
    examples: ['$sort([3, 1, 2]) /* [1, 2, 3] */'],
    docsUrl: `${DOCS}/array-functions#sort`,
  },
  {
    name: '$reverse',
    signature: '$reverse(array)',
    category: 'Array',
    description: 'Returns an array with the items in reverse order.',
    params: [{ name: 'array', type: 'array', description: 'Array to reverse' }],
    returns: 'array',
    examples: ['$reverse([1, 2, 3]) /* [3, 2, 1] */'],
    docsUrl: `${DOCS}/array-functions#reverse`,
  },
  {
    name: '$shuffle',
    signature: '$shuffle(array)',
    category: 'Array',
    description: 'Returns an array with the items shuffled into random order.',
    params: [{ name: 'array', type: 'array', description: 'Array to shuffle' }],
    returns: 'array',
    examples: ['$shuffle([1, 2, 3, 4])'],
    docsUrl: `${DOCS}/array-functions#shuffle`,
  },
  {
    name: '$distinct',
    signature: '$distinct(array)',
    category: 'Array',
    description: 'Returns an array with duplicate values removed.',
    params: [{ name: 'array', type: 'array', description: 'Input array' }],
    returns: 'array',
    examples: ['$distinct([1, 2, 2, 3, 3, 3]) /* [1, 2, 3] */'],
    docsUrl: `${DOCS}/array-functions#distinct`,
  },
  {
    name: '$zip',
    signature: '$zip(array1, array2, ...)',
    category: 'Array',
    description: 'Merges values at corresponding positions of multiple arrays.',
    params: [
      { name: 'array1', type: 'array', description: 'First array' },
      { name: 'array2', type: 'array', description: 'Additional arrays' },
    ],
    returns: 'array',
    examples: ['$zip([1, 2], ["a", "b"]) /* [[1, "a"], [2, "b"]] */'],
    docsUrl: `${DOCS}/array-functions#zip`,
  },

  {
    name: '$keys',
    signature: '$keys(object)',
    category: 'Object',
    description: 'Returns an array of the keys in the object.',
    params: [{ name: 'object', type: 'object', description: 'Input object' }],
    returns: 'array',
    examples: ['$keys({"a": 1, "b": 2}) /* ["a", "b"] */'],
    docsUrl: `${DOCS}/object-functions#keys`,
  },
  {
    name: '$lookup',
    signature: '$lookup(object, key)',
    category: 'Object',
    description: 'Returns the value associated with key in the object.',
    params: [
      { name: 'object', type: 'object', description: 'Input object' },
      { name: 'key', type: 'string', description: 'Key to look up' },
    ],
    returns: 'any',
    examples: ['$lookup({"a": 1, "b": 2}, "a") /* 1 */'],
    docsUrl: `${DOCS}/object-functions#lookup`,
  },
  {
    name: '$spread',
    signature: '$spread(object)',
    category: 'Object',
    description: 'Splits an object into an array of single-property objects.',
    params: [{ name: 'object', type: 'object', description: 'Input object' }],
    returns: 'array',
    examples: ['$spread({"a": 1, "b": 2}) /* [{"a": 1}, {"b": 2}] */'],
    docsUrl: `${DOCS}/object-functions#spread`,
  },
  {
    name: '$merge',
    signature: '$merge(array)',
    category: 'Object',
    description: 'Merges an array of objects into a single object.',
    params: [{ name: 'array', type: 'array', description: 'Array of objects' }],
    returns: 'object',
    examples: ['$merge([{"a": 1}, {"b": 2}]) /* {"a": 1, "b": 2} */'],
    docsUrl: `${DOCS}/object-functions#merge`,
  },
  {
    name: '$sift',
    signature: '$sift(object, function)',
    category: 'Object',
    description:
      'Returns an object containing only the properties for which the function returns true.',
    params: [
      { name: 'object', type: 'object', description: 'Input object' },
      {
        name: 'function',
        type: 'function',
        description: 'Predicate function(value, key)',
      },
    ],
    returns: 'object',
    examples: ['$sift(obj, function($v) { $v > 5 })'],
    docsUrl: `${DOCS}/object-functions#sift`,
  },
  {
    name: '$each',
    signature: '$each(object, function)',
    category: 'Object',
    description:
      'Applies the function to each key-value pair of the object and returns an array of results.',
    params: [
      { name: 'object', type: 'object', description: 'Input object' },
      {
        name: 'function',
        type: 'function',
        description: 'Function(value, key)',
      },
    ],
    returns: 'array',
    examples: ['$each({"a": 1, "b": 2}, function($v, $k) { $k & "=" & $v })'],
    docsUrl: `${DOCS}/object-functions#each`,
  },
  {
    name: '$error',
    signature: '$error(message?)',
    category: 'Object',
    description: 'Deliberately throws an error with an optional message.',
    params: [
      {
        name: 'message',
        type: 'string',
        optional: true,
        description: 'Error message',
      },
    ],
    returns: 'never',
    examples: ['$error("Invalid input")'],
    docsUrl: `${DOCS}/object-functions#error`,
  },
  {
    name: '$assert',
    signature: '$assert(condition, message?)',
    category: 'Object',
    description:
      'Throws an error with an optional message if the condition is not true.',
    params: [
      { name: 'condition', type: 'boolean', description: 'Condition to check' },
      {
        name: 'message',
        type: 'string',
        optional: true,
        description: 'Error message',
      },
    ],
    returns: 'boolean',
    examples: ['$assert(age >= 18, "Must be 18 or older")'],
    docsUrl: `${DOCS}/object-functions#assert`,
  },
  {
    name: '$type',
    signature: '$type(value)',
    category: 'Object',
    description: 'Returns the data type of the value as a string.',
    params: [{ name: 'value', type: 'any', description: 'Value to inspect' }],
    returns: 'string',
    examples: ['$type(123) /* "number" */', '$type([]) /* "array" */'],
    docsUrl: `${DOCS}/object-functions#type`,
  },

  {
    name: '$map',
    signature: '$map(array, function)',
    category: 'Higher-order',
    description:
      'Returns an array with the function applied to each value of the input array.',
    params: [
      { name: 'array', type: 'array', description: 'Input array' },
      {
        name: 'function',
        type: 'function',
        description: 'Function(value, index, array)',
      },
    ],
    returns: 'array',
    examples: ['$map([1, 2, 3], function($v) { $v * 2 }) /* [2, 4, 6] */'],
    docsUrl: `${DOCS}/higher-order-functions#map`,
  },
  {
    name: '$filter',
    signature: '$filter(array, function)',
    category: 'Higher-order',
    description:
      'Returns the items of the array for which the predicate function returns true.',
    params: [
      { name: 'array', type: 'array', description: 'Input array' },
      {
        name: 'function',
        type: 'function',
        description: 'Predicate function(value, index, array)',
      },
    ],
    returns: 'array',
    examples: ['$filter([1, 2, 3, 4], function($v) { $v > 2 }) /* [3, 4] */'],
    docsUrl: `${DOCS}/higher-order-functions#filter`,
  },
  {
    name: '$single',
    signature: '$single(array, function)',
    category: 'Higher-order',
    description:
      'Returns the one value in the array for which the predicate is true, erroring otherwise.',
    params: [
      { name: 'array', type: 'array', description: 'Input array' },
      {
        name: 'function',
        type: 'function',
        description: 'Predicate function(value, index, array)',
      },
    ],
    returns: 'any',
    examples: ['$single([1, 2, 3], function($v) { $v = 2 }) /* 2 */'],
    docsUrl: `${DOCS}/higher-order-functions#single`,
  },
  {
    name: '$reduce',
    signature: '$reduce(array, function, init?)',
    category: 'Higher-order',
    description:
      'Reduces the array to a single value by applying the accumulator function.',
    params: [
      { name: 'array', type: 'array', description: 'Input array' },
      {
        name: 'function',
        type: 'function',
        description: 'Reducer function(accumulator, value)',
      },
      {
        name: 'init',
        type: 'any',
        optional: true,
        description: 'Initial accumulator value',
      },
    ],
    returns: 'any',
    examples: [
      '$reduce([1, 2, 3], function($acc, $v) { $acc + $v }, 0) /* 6 */',
    ],
    docsUrl: `${DOCS}/higher-order-functions#reduce`,
  },

  {
    name: '$now',
    signature: '$now(picture?, timezone?)',
    category: 'Date/Time',
    description:
      'Returns the current timestamp as an ISO 8601 string, optionally formatted.',
    params: [
      {
        name: 'picture',
        type: 'string',
        optional: true,
        description: 'Format picture string',
      },
      {
        name: 'timezone',
        type: 'string',
        optional: true,
        description: 'Timezone offset',
      },
    ],
    returns: 'string',
    examples: [
      '$now() /* "2024-01-15T14:30:00.000Z" */',
      '$now("[Y0001]-[M01]-[D01]")',
    ],
    docsUrl: `${DOCS}/date-time-functions#now`,
  },
  {
    name: '$millis',
    signature: '$millis()',
    category: 'Date/Time',
    description: 'Returns the number of milliseconds since the Unix epoch.',
    params: [],
    returns: 'number',
    examples: ['$millis()'],
    docsUrl: `${DOCS}/date-time-functions#millis`,
  },
  {
    name: '$fromMillis',
    signature: '$fromMillis(millis, picture?, timezone?)',
    category: 'Date/Time',
    description:
      'Converts milliseconds since the Unix epoch to a formatted timestamp string.',
    params: [
      {
        name: 'millis',
        type: 'number',
        description: 'Milliseconds since Unix epoch',
      },
      {
        name: 'picture',
        type: 'string',
        optional: true,
        description: 'Format picture string',
      },
      {
        name: 'timezone',
        type: 'string',
        optional: true,
        description: 'Timezone offset',
      },
    ],
    returns: 'string',
    examples: ['$fromMillis(1705329000000)'],
    docsUrl: `${DOCS}/date-time-functions#frommillis`,
  },
  {
    name: '$toMillis',
    signature: '$toMillis(timestamp, picture?)',
    category: 'Date/Time',
    description:
      'Converts an ISO 8601 timestamp string to milliseconds since the Unix epoch.',
    params: [
      { name: 'timestamp', type: 'string', description: 'Timestamp string' },
      {
        name: 'picture',
        type: 'string',
        optional: true,
        description: 'Format picture string',
      },
    ],
    returns: 'number',
    examples: ['$toMillis("2024-01-15T14:30:00Z")'],
    docsUrl: `${DOCS}/date-time-functions#tomillis`,
  },
]

/** Map of function name → definition for O(1) lookups. */
export const JSONATA_FUNCTION_MAP: Map<string, JsonataFunction> = new Map(
  JSONATA_FUNCTIONS.map((fn) => [fn.name, fn]),
)

/** Set of every built-in function name including the `$` prefix. */
export const JSONATA_FUNCTION_NAMES: Set<string> = new Set(
  JSONATA_FUNCTIONS.map((fn) => fn.name),
)

/** Reserved JSONata keywords. */
export const JSONATA_KEYWORDS = [
  'function',
  'true',
  'false',
  'null',
  'and',
  'or',
  'in',
]
