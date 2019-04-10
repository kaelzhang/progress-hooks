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

  t.is(hooks.accelerate.isUsed(), false)
  t.is(hooks.brake.isUsed(), false)
  t.is(hooks.stop.isUsed(), false)

  let speed = 0
  hooks.accelerate.tap('GasPlugin', newSpeed => {
    speed = newSpeed
  })

  t.is(hooks.accelerate.isUsed(), true)

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

  t.is(hooks.brake.isUsed(), false)
  t.is(hooks.stop.isUsed(), false)

  // Should not fail
  await hooks.brake.promise()
  await new Promise(resolve => {
    hooks.brake.callAsync(resolve)
  })

  t.throws(() => hooks.stop.call(), 'stop.call is not a function')

  hooks.accelerate.call(120)
  t.is(hooks.brake.isUsed(), true)

  t.is(speed, 120)

  await new Promise(resolve => {
    hooks.brake.callAsync(() => {
      resolve()
    })
  })

  t.is(speed, 70)

  t.is(hooks.stop.isUsed(), true)

  await hooks.stop.promise()
  t.is(speed, 0)
}

test('contructor: no argument', t => {
  t.notThrows(() => new Hooks())
})

test('error: no object', t => {
  t.throws(() => new Hooks({
    a: null
  }), 'hook must be an object')
})

test('error: hook.hook no object', t => {
  t.throws(() => new Hooks({
    a: {
      hook: 'a'
    }
  }), 'hook must be an object')
})

test('error: no number', t => {
  t.throws(() => new Hooks({
    a: {
      plan: '2',
      hook: new SyncHook()
    }
  }), 'plan must be a number')
})

test('error: plan less than 1', t => {
  t.throws(() => new Hooks({
    a: {
      plan: 0,
      hook: new SyncHook()
    }
  }), 'plan should not less than 1')
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

test('Object.keys, and getter', t => {
  const hook = new SyncHook()
  const hooks = new Hooks({
    a: hook,
    b: new SyncHook(),
    c: new SyncHook()
  })

  t.deepEqual(Object.keys(hooks), ['a', 'b', 'c'])
})

test('plan', async t => {
  const hooks = new Hooks({
    b: {
      hook: new SyncHook(),
      plan: 2
    },
    c: new SyncHook()
  })

  const message = 'Booooooooom!!'

  hooks.c.tap('BoomPlugin', () => {
    throw new Error(message)
  })

  t.notThrows(() => hooks.c.call())
  hooks.b.call()
  t.notThrows(() => hooks.c.call())
  hooks.b.call()
  t.throws(() => hooks.c.call(), message)
})
