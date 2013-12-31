# Javascript implementation of xxHash

## Synopsis

xxHash is a very fast hashing algorithm (see the details [here](https://code.google.com/p/xxhash/)). xxhashjs is a Javascript implementation of it, written in 100% Javascript. Although not as fast as the C version, it does perform pretty well given the current Javascript limitations in handling unsigned 32 bits integers.


## Installation

In nodejs:

    npm install xxhashjs

In the browser, include the following, and access the constructor with _XXH_:

`<script src="/your/path/to/uint32.js"></script>`
`<script src="/your/path/to/xxhash.js"></script>`

NB. xxhashjs depends on the [uint32 library](https://github.com/pierrec/js-cuint) that emulates unsigned 32 bits integers in Javascript.


## Examples

* In one step:
```var h = XXH( 'abcd', 0xABCD ).toString(16)	// seed = 0xABCD```
> 0xCDA8FAE4

* In several steps (useful in conjunction of NodeJS streams):
```var H = XXH( 0xABCD )	// seed = 0xABCD
var h = H.update( 'abcd' ).digest().toString(16)
```
> 0xCDA8FAE4


## Usage

* In one step:
`XXH(<data>, <seed>)`
The data can either be a string or a NodeJS Buffer object.
The seed can either be a number or a UINT32 object.

* In several steps:
	* instantiate a new XXH object:
`XXH(<seed>)` or `XXH()`
The seed can be set later on with the `init` method

	* add data to the hash calculation:
`XXH.update(<data>)`

	* finish the calculations:
`XXH.digest()`

The object returned can be converted to a string with `toString(<radix>)` or a number `toNumber()`.
Once `digest()` has been called, the object can be reused. The same seed will be used or it can be changed with `init(<seed>)`.


## Methods

* `XXH.init(<seed>)`
Initialize the XXH object with the given seed. The seed can either be a number or a UINT32 object.
* `XXH.update(<data>)`
Add data for hashing. The data can either be a string or a NodeJS Buffer object.
* `XXH.digest()`
Finalize the hash calculations


## License

MIT