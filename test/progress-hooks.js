const test = require('ava')
const log = require('util').debuglog('progress-hooks')

const {
  SyncHook,
  AsyncParallelHook
} = require('tapable')

const {
  ADD,
  CLEAN,
  Hooks
} = require('../src')

test('contructor: no argument', t => {
  t.notThrows(() => new Hooks())
})

test('complex normal', async t => {
  const hooks = new Hooks({
    accelerate: new SyncHook('newSpeed'),
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

  await hooks.brake.promise()

  hooks.accelerate.call(120)
  t.is(speed, 120)
})
