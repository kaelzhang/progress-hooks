[![Build Status](https://travis-ci.org/kaelzhang/progress-hooks.svg?branch=master)](https://travis-ci.org/kaelzhang/progress-hooks)
[![Coverage](https://codecov.io/gh/kaelzhang/progress-hooks/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/progress-hooks)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/progress-hooks?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/progress-hooks)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/progress-hooks.svg)](http://badge.fury.io/js/progress-hooks)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/progress-hooks.svg)](https://www.npmjs.org/package/progress-hooks)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/progress-hooks.svg)](https://david-dm.org/kaelzhang/progress-hooks)
-->

# progress-hooks

The manager of sequential hooks to work with [`tapable`](https://www.npmjs.com/package/tapable).

`progress-hooks` will apply the taps only if the previous hook has been called.

Usually, it used to replace the code slice `this.hooks = {}` of the `tapable` example

## Install

```sh
$ npm i progress-hooks
```

## Usage

```js
const {
  SyncHook,
  AsyncParallelHook
} = require('tapable')
const {Hooks} = require('progress-hooks')

class Car {
  constructor () {
    this.hooks = new Hooks({
      accelerate: new SyncHook(['newSpeed']),
      brake: new SyncHook()
    })
  }
}

const car = new Car()
let speed = 0

// The `LoggerPlugin` method is not actually tapped into the `car.hooks.brake`,
// but instead, it is held by `progress-hooks`
car.hooks.brake.tap('LoggerPlugin', () => {
  if (speed === 0) {
    throw new Error('can not brake')
  }

  console.log('brake')
})

// And it will not called
car.hooks.brake.call()

car.hooks.accelerate.tap('SetterPlugin', newSpeed => {
  speed = newSpeed
})

car.hook.accelerate.call(120)
// And after `car.hook.accelerate.call()` is invoked,
// The `LoggerPlugin` will be applied

car.hooks.brake.call()
// it print: 'brake'
```

## License

MIT
