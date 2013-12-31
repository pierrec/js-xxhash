# C-like unsigned integers for Javascript

## Synopsis

Javascript does not natively support handling of unsigned 32 or 64 bits integers. This library provides that functionality, following C behaviour, enabling the writing of algorithms that depend on it.

TODO
64 bits integers not supported yet!


## How it works

An unsigned 32 bits integer is represented by an object with its first 16 bits (low bits) and its 16 last ones (high bits). All the supported standard operations on the unsigned integer are then performed transparently.

	e.g.
	10000010000100000100010000100010 (2182104098 or 0x82104422) is represented by:
	high=1000001000010000
	low= 0100010000100010

NB.
In case of overflow, the unsigned integer is _truncated_ to its lowest 32 bits.

The same applies to 64 bits integers, which are split into 4 16 bits ones.

## Installation

In nodejs:

    npm install cuint

In the browser, include the following, and access the constructor with _UINT32_:

`<script src="/your/path/to/uint32.js"></script>
...
<script type="text/javascript">
  var prime1 = UINT32('3266489917');
  var prime2 = UINT32('2654435761');
  var prime1plus2 = prime1.add(prime2)
</script>`

## Usage

To instantiate an unsigned 32 bits integer, do any of the following:

	var UINT32 = require('cuint').UINT32 // NodeJS
	UINT32( <low bits>, <high bits> )
	UINT32( <number> )
	UINT32( '<number>' )

## Examples

* Using low and high bits
> `UINT32( 2, 1 )		// 65538`
> { remainder: null, _low: 2, _high: 1 }

* Using a number (signed 32 bits integer)
> `UINT32( 65538 ) 	// 65538`
> { remainder: null, _low: 2, _high: 1 }

* Using a string
> `UINT32( '65538' )	// 65538`
> { remainder: null, _low: 2, _high: 1 }

* Using another string
> `UINT32( '3266489917' )`
> { remainder: null, _low: 44605, _high: 49842 }

* Divide 2 unsigned 32 bits integers - note that the remainder is also provided
> `UINT32( '3266489917' ).div( UINT32( '668265263' ) )`
> {	remainder:
>			{	remainder: null
>			,	_low: 385
>			,	_high: 9055
>			}
>	,	_low: 4
>	,	_high: 0
>	}

## Methods

* `UINT32.fromBits(<low bits>, <high bits>)*`
Set the current _UINT32_ object with its low and high bits
* `UINT32.fromNumber(<number>)*`
Set the current _UINT32_ object from a number
* `UINT32.fromString(<string>, <radix>)*`
Set the current _UINT32_ object from a string
* `UINT32.toNumber()`
Convert this _UINT32_ to a number
* `UINT32.toString(<radix>)`
Convert this _UINT32_ to a string
* `UINT32.add(<uint>)*`
Add two _UINT32_. The current _UINT32_ stores the result
* `UINT32.subtract(<uint>)*`
Subtract two _UINT32_. The current _UINT32_ stores the result
* `UINT32.multiply(<uint>)*`
Multiply two _UINT32_. The current _UINT32_ stores the result
* `UINT32.div(<uint>)*`
Divide two _UINT32_. The current _UINT32_ stores the result.
The remainder is made available as the _remainder_ property on the _UINT32_ object.
It can be null, meaning there are no remainder.
* `UINT32.negate()` alias `UINT32.not()`
Negate the current _UINT32_
* `UINT32.equals(<uint>)` alias `UINT32.eq(<uint>)`
Equals
* `UINT32.lessThan(<uint>)` alias `UINT32.lt(<uint>)`
Less than (strict)
* `UINT32.greaterThan(<uint>)` alias `UINT32.gt(<uint>)`
Greater than (strict)
* `UINT32.or(<uint>)*`
Bitwise OR
* `UINT32.and(<uint>)*`
Bitwise AND
* `UINT32.xor(<uint>)*`
Bitwise XOR
* `UINT32.shiftRight(<number>)*` alias `UINT32.shiftr(<number>)*`
Bitwise shift right
* `UINT32.shiftLeft(<number>[, <allowOverflow>])*` alias `UINT32.shiftl(<number>[, <allowOverflow>])*`
Bitwise shift left
* `UINT32.rotateLeft(<number>)*` alias `UINT32.rotl(<number>)*`
Bitwise rotate left
* `UINT32.rotateRight(<number>)*` alias `UINT32.rotr(<number>)*`
Bitwise rotate right
* `UINT32.clone()`
Clone the current _UINT32_

NB. methods with an * do __modify__ the object it is applied to. Input objects are not modified.

## License

MIT


> Written with [StackEdit](https://stackedit.io/).