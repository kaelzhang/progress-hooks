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
    brake: new AsyncParallelHook()
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

  // Should not fail
  await hooks.brake.promise()

  hooks.accelerate.call(120)

  t.is(speed, 120)

  await new Promise(resolve => {
    hooks.brake.callAsync(() => {
      t.is(speed, 100)
      resolve()
    })
  })
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

  hooks[CLEAN]()

  hooks.accelerate.call(120)
  hooks.brake.call()

  t.is(speed, 120)
})
