const Repository = require('./Repository')
const { $git, $octokit } = require('./symbols')

module.exports = class Wrapper {
  repository (name) {
    return new Repository(this[$git], this[$octokit], name)
  }

  constructor (git, octokit) {
    this[$git] = git
    this[$octokit] = octokit
  }
}
