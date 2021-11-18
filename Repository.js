const { $context, $repository, $git, $clone } = require('./symbols')
const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const gitFactory = require('./git')

module.exports = class Repository {
  async createBranch (name, from = 'main') {
    const { octokit } = this[$context]
    const { data: fromRef } = await octokit.request(`GET /repos/${this[$repository]}/git/refs/heads/${from}`)
    const response = await octokit.request(`POST /repos/${this[$repository]}/git/refs`, {
      ref: `refs/heads/${name}`,
      sha: fromRef.object.sha
    })
    if (response.status !== 201) {
      throw new Error('Not able to create branch')
    }
  }

  get cloned () {
    return this[$clone] !== undefined
  }

  async clone () {
    if (this.cloned) {
      return
    }
    const { octokit, git, options, user } = this[$context]
    const { data: repo } = await octokit.request(`GET /repos/${this[$repository]}`)
    this[$clone] = join(options.work, this[$repository])
    const cloneUrl = repo.clone_url.replace(/^https:\/\//, `https://${user.login}:${options.auth}@`)
    await git('clone', cloneUrl, this[$repository])
    this[$git] = gitFactory(this[$clone])
    this.git('config', '--local', '--add', 'user.name', user.login)
    this.git('config', '--local', '--add', 'user.email', user.email)
  }

  async git (...args) {
    await this.clone()
    await this[$git](...args)
  }

  async checkout (branchName = 'main') {
    await this.git('checkout', branchName)
  }

  async readFile (fileName) {
    await this.clone()
    return (await readFile(join(this[$clone], fileName))).toString()
  }

  async writeFile (fileName, content) {
    await this.clone()
    return await writeFile(join(this[$clone], fileName), content)
  }

  async commitAllAndPush (message) {
    await this.git('add', '.')
    await this.git('commit', '-m', message)
    await this.git('push')
  }

  async createPullRequest (title, body, head, base = 'main') {
    const { octokit } = this[$context]
    const response = await octokit.request(`POST /repos/${this[$repository]}/pulls`, {
      title,
      body,
      head,
      base
    })
    if (response.status !== 201) {
      throw new Error('Not able to create pull request')
    }
    const { html_url: url } = response.data
    console.log(`Pull request created: ${url}`)
  }

  constructor (context, repositoryName) {
    this[$context] = context
    this[$repository] = repositoryName
  }
}
