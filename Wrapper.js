const Repository = require('./Repository')
const { $context } = require('./symbols')

module.exports = class Wrapper {
  repository (name) {
    return new Repository(this[$context], name)
  }

  constructor (context) {
    this[$context] = context
  }
}
