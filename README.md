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

`progress-hooks` applies the taps(plugins) only if the previous hook has been called.

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
const {
  Hooks,
  ADD,
  CLEAN
} = require('progress-hooks')

class Car {
  constructor () {
    // this.hooks = {
    //   accelerate: new SyncHook(['newSpeed']),
    //   brake: new SyncHook()
    // }

    // Instead of the code above, we create hooks by `new Hooks()`

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

// And it will not be called
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

## new Hooks(rawHooks, options)

- **rawHooks** `{[string]: tapable.Hook}`
- **options?** `Object`
  - **disableAfterCalled?** `boolean=true` If `true`(the default value) the hook will be disabled after called.

Returns `hooks`

The returned `hooks` is a relatively clean object that we can get all hook names just with `Object.keys(hooks)`:

```js
Object.keys(car.hooks)
// ['accelerate', 'brake']
```

And we can access the real tapable hook by access:

```js
car.hooks.accelerate.hook  // -> The tapable hook
```

### `hooks[ADD](name, hook)`

Adds a new hook.

```js
const hooks = new Hooks()

hooks[ADD]('accelerate', new SyncHook(['newSpeed']))
```

### `hooks[CLEAN]()`

Cleans hook taps if the hook is not enabled, so that we could reload plugins.

## License

MIT
