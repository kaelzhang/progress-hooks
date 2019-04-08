const once = require('once')

const symbolFor = s => Symbol.for(`progress-hooks:${s}`)
const symbol = s => Symbol(`progress-hooks:${s}`)

const ADD = symbolFor('add')
const CLEAN = symbolFor('clean')

const PRIVATE_CLEAN = symbol('clean')
const PRIVATE_ENABLE = symbol('enable')
const PRIVATE_DISABLE = symbol('disable')

class Holder {
  constructor (name, hook, afterCalled) {
    this._name = name
    this._hook = hook
    this._enabled = false
    this._directives = []
    this._afterCalled = once(afterCalled)
  }

  [PRIVATE_CLEAN] () {
    this._directives.length = 0
  }

  _apply (type, ...args) {
    return this._hook[type](...args)
  }

  _tap (type, options, fn) {
    if (this._enabled) {
      this._apply(type, options, fn)
      return
    }

    this._directives.push([type, options, fn])
  }

  tap (options, fn) {
    this._tap('tap', options, fn)
  }

  tapAsync (options, fn) {
    this._tap('tapAsync', options, fn)
  }

  tapPromise (options, fn) {
    this._tap('tapPromise', options, fn)
  }

  call (...args) {
    // new AsyncParallelHook().call
    if (!this._hook.call) {
      throw new TypeError(`${this._name}.call is not a function`)
    }

    if (!this._enabled) {
      return
    }

    this._hook.call(...args)
    this._afterCalled()
  }

  callAsync (...args) {
    const callback = args.pop()

    if (!this._enabled) {
      callback()
      return
    }

    this._hook.promise(...args)
    .then(
      () => {
        callback()
        this._afterCalled()
      },
      callback
    )
  }

  promise (...args) {
    if (!this._enabled) {
      return Promise.resolve()
    }

    return this._hook.promise(...args)
    .then(() => {
      this._afterCalled()
    })
  }

  [PRIVATE_ENABLE] () {
    this._enabled = true
    this._directives.forEach(args => {
      this._apply(...args)
    })
    this[PRIVATE_CLEAN]()
  }

  [PRIVATE_DISABLE] () {
    this._enabled = false
  }
}

class Hooks {
  constructor (hooks = {}, {
    disableAfterCalled = true
  } = {}) {
    this._current = - 1
    this._drained = true
    this._disableAfterCalled = disableAfterCalled
    this._hooks = []

    Object.keys(hooks).forEach(name => {
      this[ADD](name, hooks[name])
    })
  }

  _next () {
    const next = this._current + 1
    const has = next in this._hooks

    if (has) {
      this._drained = false
      this._current ++
      const name = this._hooks[next]
      this[name][PRIVATE_ENABLE]()
      return
    }

    this._drained = true
  }

  [ADD] (name, hook) {
    this._hooks.push(name)

    let holder = new Holder(name, hook, () => {
      if (this._disableAfterCalled) {
        holder[PRIVATE_DISABLE]()
      }

      this._next()
      holder = null
    })

    this[name] = holder

    if (this._drained) {
      this._next()
    }
  }

  [CLEAN] () {
    this._hooks.forEach(name => {
      this[name][PRIVATE_CLEAN]()
    })
  }
}

module.exports = {
  Hooks,
  ADD,
  CLEAN
}
