const test = require('ava')
// const log = require('util').debuglog('progress-hooks')

const {
  SyncHook,
  AsyncParallelHook
} = require('tapable')

const {
  ADD,
  CLEAN,
  Hooks
} = require('../src')

const run = async t => {
  const hooks = new Hooks({
    accelerate: new SyncHook(['newSpeed']),
    brake: new AsyncParallelHook(),
    stop: new AsyncParallelHook()
  })

  let speed = 0
  hooks.accelerate.tap('GasPlugin', newSpeed => {
    speed = newSpeed
  })

  hooks.brake.tapAsync('BrakePlugin', callback => {
    if (speed === 0) {
      throw new Error('boooooooooooom!!! no speed')
    }

    setTimeout(() => {
      speed -= 20
      callback()
    }, 20)
  })

  hooks.brake.tapPromise('BrakePlugin', () => new Promise(resolve => {
    setTimeout(() => {
      speed -= 30
      resolve()
    }, 10)
  }))

  hooks.stop.tapPromise('ParkPlugin', () => new Promise(resolve => {
    setTimeout(() => {
      speed = 0
      resolve()
    })
  }))

  // Should not fail
  await hooks.brake.promise()
  await new Promise(resolve => {
    hooks.brake.callAsync(resolve)
  })

  t.throws(() => hooks.stop.call(), 'stop.call is not a function')

  hooks.accelerate.call(120)

  t.is(speed, 120)

  await new Promise(resolve => {
    hooks.brake.callAsync(() => {
      resolve()
    })
  })

  t.is(speed, 70)

  await hooks.stop.promise()
  t.is(speed, 0)
}

test('contructor: no argument', t => {
  t.notThrows(() => new Hooks())
})

test('complex normal', run)

test('clean', t => {
  const hooks = new Hooks({
    accelerate: new SyncHook(['newSpeed'])
  })

  hooks[ADD]('brake', new SyncHook())

  let speed = 0
  hooks.accelerate.tap('GasPlugin', newSpeed => {
    speed = newSpeed
  })

  hooks.brake.tap('BoomPlugin', () => {
    throw new Error('boooooooooooooom')
  })

  // should not run
  hooks.brake.call()

  hooks[CLEAN]()

  hooks.accelerate.call(120)
  hooks.brake.call()

  t.is(speed, 120)

  // Has been disabled, should not fails
  hooks.brake.tap('BoomPlugin', () => {
    throw new Error('boooooooooooooom')
  })

  hooks.brake.call()
})

test('disabledAfterCalled = false', t => {
  const hooks = new Hooks({
    accelerate: new SyncHook()
  }, {
    disableAfterCalled: false
  })

  hooks.accelerate.call()

  hooks.accelerate.tap('BoomPlugin', () => {
    throw new Error('Booooooooooom!!')
  })

  t.throws(() => hooks.accelerate.call())
})
