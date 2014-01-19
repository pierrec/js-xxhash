var fs = require('fs')
var assert = require('assert')
var XXH = require('..')

describe('XXH', function () {
	var seed = 0

	describe('with small input multiple of 4', function () {
		var input = 'abcd'
		var expected = 'A3643705' // Computed with xxHash C version

		it('should return hash in a single step', function (done) {
			var h = XXH( input, seed ).toString(16).toUpperCase()

			assert.equal( h, expected )
			done()
		})

		it('should return hash in many steps', function (done) {
			var H = XXH( seed )
			var h = H.update( input ).digest().toString(16).toUpperCase()

			assert.equal( h, expected )
			done()
		})

	})

	describe('with medium input multiple of 4', function () {
		var input = Array(1001).join('abcd')
		var expected = 'E18CBEA'

		it('should return hash in a single step', function (done) {
			var h = XXH( input, seed ).toString(16).toUpperCase()

			assert.equal( h, expected )
			done()
		})

		it('should return hash in many steps', function (done) {
			var H = XXH( seed )
			var h = H.update( input ).digest().toString(16).toUpperCase()

			assert.equal( h, expected )
			done()
		})

	})

	describe('with small input', function () {
		var input = 'abc'
		var expected = '32D153FF' // Computed with xxHash C version

		it('should return hash in a single step', function (done) {
			var h = XXH( input, seed ).toString(16).toUpperCase()

			assert.equal( h, expected )
			done()
		})

		it('should return hash in many steps', function (done) {
			var H = XXH( seed )
			var h = H.update( input ).digest().toString(16).toUpperCase()

			assert.equal( h, expected )
			done()
		})

	})

	describe('with medium input', function () {
		var input = Array(1000).join('abc')
		var expected = '89DA9B6E'

		it('should return hash in a single step', function (done) {
			var h = XXH( input, seed ).toString(16).toUpperCase()

			assert.equal( h, expected )
			done()
		})

		it('should return hash in many steps', function (done) {
			var H = XXH( seed )
			var h = H.update( input ).digest().toString(16).toUpperCase()

			assert.equal( h, expected )
			done()
		})

	})

})
