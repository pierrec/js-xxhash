/**
xxHash64 implementation in pure Javascript

Copyright (C) 2016, Pierre Curto
Copyright (C) 2019, Daniel Lo Nigro <d.sb>
MIT license
*/

/*
 * Constants
 */
var PRIME64_1 = BigInt( '11400714785074694791' )
var PRIME64_2 = BigInt( '14029467366897019727' )
var PRIME64_3 = BigInt(  '1609587929392839161' )
var PRIME64_4 = BigInt(  '9650029242287828579' )
var PRIME64_5 = BigInt(  '2870177450012600261' )
var BITS = 64n
var BITMASK = 2n ** BITS - 1n

/**
* Convert string to proper UTF-8 array
* @param str Input string
* @returns {Uint8Array} UTF8 array is returned as uint8 array
*/
function toUTF8Array (str) {
	var utf8 = []
	for (var i=0, n=str.length; i < n; i++) {
		var charcode = str.charCodeAt(i)
		if (charcode < 0x80) utf8.push(charcode)
		else if (charcode < 0x800) {
			utf8.push(0xc0 | (charcode >> 6),
			0x80 | (charcode & 0x3f))
		}
		else if (charcode < 0xd800 || charcode >= 0xe000) {
			utf8.push(0xe0 | (charcode >> 12),
			0x80 | ((charcode>>6) & 0x3f),
			0x80 | (charcode & 0x3f))
		}
		// surrogate pair
		else {
			i++;
			// UTF-16 encodes 0x10000-0x10FFFF by
			// subtracting 0x10000 and splitting the
			// 20 bits of 0x0-0xFFFFF into two halves
			charcode = 0x10000 + (((charcode & 0x3ff)<<10)
			| (str.charCodeAt(i) & 0x3ff))
			utf8.push(0xf0 | (charcode >>18),
			0x80 | ((charcode>>12) & 0x3f),
			0x80 | ((charcode>>6) & 0x3f),
			0x80 | (charcode & 0x3f))
		}
	}

	return new Uint8Array(utf8)
}

/**
 * Converts bits to a BigInt.
 * @param {Number} first low bits (8)
 * @param {Number} second low bits (8)
 * @param {Number} first high bits (8)
 * @param {Number} second high bits (8)
 */
function bitsToBigInt(a00, a16, a32, a48) {
	return (
		BigInt(a00) | 
		(BigInt(a16) << 16n) |
		(BigInt(a32) << 32n) |
		(BigInt(a48) << 48n)
	)
}

/**
 * Converts a chunk of memory (either an ArrayBuffer or a Node.js Buffer)
 * to a BigInt representing a 64-bit integer.
 * @param {ArrayBuffer|Buffer} The buffer
 * @param {number} offset
 * @return BigInt
 */
function memoryToBigInt(memory, offset) {
	return (
		BigInt(memory[offset]) | 
		(BigInt(memory[offset+1]) << 8n) |
		(BigInt(memory[offset+2]) << 16n) |
		(BigInt(memory[offset+3]) << 24n) |
		(BigInt(memory[offset+4]) << 32n) |
		(BigInt(memory[offset+5]) << 40n) |
		(BigInt(memory[offset+6]) << 48n) | 
		(BigInt(memory[offset+7]) << 56n)
	)
}

/**
 * Performs a left bitwise rotation on the given unsigned 64-bit integer.
 * @param {BigInt} number to rotate
 * @param {BigInt} number of bits to rotate by
 * @return BigInt
 */
function rotateLeft(value, rotation) {
	return (
		((value << rotation) & BITMASK) |
		(value >> (BITS - rotation))
	);
}

/**
 * Truncate a BigInt to a 64-bit unsigned integer.
 * @param {BigInt} number to truncate
 * @return BigInt
 */
function truncate(value) {
	return BigInt.asUintN(64, value);
}

/**
 * XXH64 object used as a constructor or a function
 * @constructor
 * or
 * @param {Object|String} input data
 * @param {Number|UINT64} seed
 * @return ThisExpression
 * or
 * @return {UINT64} xxHash
 */
function XXH64 () {
	if (arguments.length == 2)
		return new XXH64( arguments[1] ).update( arguments[0] ).digest()

	if (!(this instanceof XXH64))
		return new XXH64( arguments[0] )

	init.call(this, arguments[0])
}

/**
 * Initialize the XXH64 instance with the given seed
 * @method init
 * @param {Number|Object} seed as a number or an unsigned 32 bits integer
 * @return ThisExpression
 */
 function init (seed) {
	this.seed = BigInt.asUintN(32, BigInt(seed))
	this.v1 = truncate(this.seed + PRIME64_1 + PRIME64_2)
	this.v2 = truncate(this.seed + PRIME64_2)
	this.v3 = this.seed
	this.v4 = truncate(this.seed - PRIME64_1)
	this.total_len = 0
	this.memsize = 0
	this.memory = null

	return this
}
XXH64.prototype.init = init

/**
 * Add data to be computed for the XXH64 hash
 * @method update
 * @param {String|Buffer|ArrayBuffer} input as a string or nodejs Buffer or ArrayBuffer
 * @return ThisExpression
 */
XXH64.prototype.update = function (input) {
	var isArrayBuffer

	// Convert all strings to utf-8 first (issue #5)
	if (typeof input == 'string') {
		input = toUTF8Array(input)
		isArrayBuffer = true
	}

	if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer)
	{
		isArrayBuffer = true
		input = new Uint8Array(input);
	}

	var p = 0
	var len = input.length
	var bEnd = p + len

	if (len == 0) return this

	this.total_len += len

	if (this.memsize == 0)
	{
		if (isArrayBuffer) {
			this.memory = new Uint8Array(32)
		} else {
			this.memory = new Buffer(32)
		}
	}

	if (this.memsize + len < 32)   // fill in tmp buffer
	{
		// XXH64_memcpy(this.memory + this.memsize, input, len)
		if (isArrayBuffer) {
			this.memory.set( input.subarray(0, len), this.memsize )
		} else {
			input.copy( this.memory, this.memsize, 0, len )
		}

		this.memsize += len
		return this
	}

	if (this.memsize > 0)   // some data left from previous update
	{
		// XXH64_memcpy(this.memory + this.memsize, input, 16-this.memsize);
		if (isArrayBuffer) {
			this.memory.set( input.subarray(0, 32 - this.memsize), this.memsize )
		} else {
			input.copy( this.memory, this.memsize, 0, 32 - this.memsize )
		}

		var p64 = 0
		var other
		other = memoryToBigInt(this.memory, p64)
		this.v1 = truncate(rotateLeft(truncate(this.v1 + other * PRIME64_2), 31n) * PRIME64_1);
		p64 += 8
		other = memoryToBigInt(this.memory, p64)
		this.v2 = truncate(rotateLeft(truncate(this.v2 + other * PRIME64_2), 31n) * PRIME64_1);
		p64 += 8
		other = memoryToBigInt(this.memory, p64)
		this.v3 = truncate(rotateLeft(truncate(this.v3 + other * PRIME64_2), 31n) * PRIME64_1);
		p64 += 8
		other = memoryToBigInt(this.memory, p64)
		this.v4 = truncate(rotateLeft(truncate(this.v4 + other * PRIME64_2), 31n) * PRIME64_1);

		p += 32 - this.memsize
		this.memsize = 0
	}

	if (p <= bEnd - 32)
	{
		var limit = bEnd - 32

		do
		{
			var other
			other = memoryToBigInt(input, p)
			this.v1 = truncate(rotateLeft(truncate(this.v1 + other * PRIME64_2), 31n) * PRIME64_1);
			p += 8
			other = memoryToBigInt(input, p)
			this.v2 = truncate(rotateLeft(truncate(this.v2 + other * PRIME64_2), 31n) * PRIME64_1);
			p += 8
			other = memoryToBigInt(input, p)
			this.v3 = truncate(rotateLeft(truncate(this.v3 + other * PRIME64_2), 31n) * PRIME64_1);
			p += 8
			other = memoryToBigInt(input, p)
			this.v4 = truncate(rotateLeft(truncate(this.v4 + other * PRIME64_2), 31n) * PRIME64_1);
			p += 8
		} while (p <= limit)
	}

	if (p < bEnd)
	{
		// XXH64_memcpy(this.memory, p, bEnd-p);
		if (isArrayBuffer) {
			this.memory.set( input.subarray(p, bEnd), this.memsize )
		} else {
			input.copy( this.memory, this.memsize, p, bEnd )
		}

		this.memsize = bEnd - p
	}

	return this
}

/**
 * Finalize the XXH64 computation. The XXH64 instance is ready for reuse for the given seed
 * @method digest
 * @return {UINT64} xxHash
 */
XXH64.prototype.digest = function () {
	var input = this.memory
	var p = 0
	var bEnd = this.memsize
	var h64, h
	var u

	if (this.total_len >= 32)
	{
		h64 = rotateLeft(this.v1, 1n) + 
			rotateLeft(this.v2, 7n) + 
			rotateLeft(this.v3, 12n) + 
			rotateLeft(this.v4, 18n)

		h64 = truncate(h64 ^ (rotateLeft(truncate(this.v1 * PRIME64_2), 31n) * PRIME64_1))
		h64 = truncate(h64 * PRIME64_1 + PRIME64_4)

		h64 = truncate(h64 ^ (rotateLeft(truncate(this.v2 * PRIME64_2), 31n) * PRIME64_1))
		h64 = truncate(h64 * PRIME64_1 + PRIME64_4)

		h64 = truncate(h64 ^ (rotateLeft(truncate(this.v3 * PRIME64_2), 31n) * PRIME64_1))
		h64 = truncate(h64 * PRIME64_1 + PRIME64_4)

		h64 = truncate(h64 ^ (rotateLeft(truncate(this.v4 * PRIME64_2), 31n) * PRIME64_1))
		h64 = truncate(h64 * PRIME64_1 + PRIME64_4)
	}
	else
	{
		h64  = truncate(this.seed + PRIME64_5)
	}

	h64 += BigInt(this.total_len)

	while (p <= bEnd - 8)
	{
		u = memoryToBigInt(input, p)
		u = truncate(rotateLeft(truncate(u * PRIME64_2), 31n) * PRIME64_1)
		
		h64 = truncate((rotateLeft(h64 ^ u, 27n) * PRIME64_1) + PRIME64_4)
		p += 8
	}

	if (p + 4 <= bEnd) {
		u = bitsToBigInt(
			(input[p+1] << 8) | input[p]
		,	(input[p+3] << 8) | input[p+2]
		,	0
		,	0
		)
		h64 = truncate((rotateLeft(h64 ^ truncate((u * PRIME64_1)), 23n) * PRIME64_2) + PRIME64_3)
		p += 4
	}

	while (p < bEnd)
	{
		u = bitsToBigInt( input[p++], 0, 0, 0 )
		h64 = truncate(rotateLeft(h64 ^ truncate(u * PRIME64_5), 11n) * PRIME64_1)
	}

	h = truncate(h64 >> 33n)
	h64 = truncate((h64 ^ h) * PRIME64_2)

	h = truncate(h64 >> 29n)
	h64 = truncate((h64 ^ h) * PRIME64_3)

	h = truncate(h64 >> 32n)
	h64 = truncate(h64 ^ h)

	// Reset the state
	this.init( this.seed )

	return h64
}

module.exports = XXH64
