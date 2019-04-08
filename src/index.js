const symbolFor = s => Symbol.for(`progress-hooks:${s}`)
const symbol = s => Symbol(`progress-hooks:${s}`)

const ADD = symbolFor('add')
const CLEAN = symbolFor('clean')

const PRIVATE_CLEAN = symbol('clean')
const PRIVATE_ENABLE = symbol('enable')

class Holder {
  constructor (hook, onEnable) {
    this._hook = hook
    this._enabled = false
    this._directives = []
    this._onEnable = onEnable
  }

  [PRIVATE_CLEAN] () {
    this._directives.length = 0
  }

  _apply (type, ...args) {
    this._hook[type](...args)
  }

  _tap (type, options, fn) {
    if (this._enabled) {
      this._apply(type, options, fn)
      return
    }

    this._directives.push([type, options, fn])
  }

  _call (type, ...args) {
    if (this._enabled) {
      this._apply(type, ...args)
    }
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
    this._call('call', ...args)
  }

  callAsync (...args) {
    this._call('callAsync', ...args)
  }

  promise (...args) {
    this._call('promise', ...args)
  }

  [PRIVATE_ENABLE] () {
    if (this._enabled) {
      return
    }

    this._enabled = false
    this._directives.forEach(args => {
      this._apply(...args)
    })
    this[PRIVATE_CLEAN]()
    this._onEnable()
  }
}

class Hooks {
  constructor (hooks = {}) {
    this._current = - 1
    this._drained = true
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
    this[name] = new Holder(hook, () => {
      this._next()
    })

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
