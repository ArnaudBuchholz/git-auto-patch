const Repository = require('./Repository')
const { $context } = require('./symbols')

module.exports = class Github {
  async get (url) {
    const { octokit } = this[$context]
    return await octokit.request(`GET ${url}`)
  }

  repository (name) {
    return new Repository(this[$context], name)
  }

  constructor (context) {
    this[$context] = context
  }
}
