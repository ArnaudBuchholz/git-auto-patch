const { $context, $repository, $git, $clone } = require('./symbols')
const { readFile, writeFile, access } = require('fs/promises')
const { join } = require('path')
const gitFactory = require('./gitFactory')

module.exports = class Repository {
  async createBranch (name, from = 'main') {
    const { octokit, options } = this[$context]
    if (options.verbose) {
      console.log(`Creating branch ${name} from ${from}...`)
    }
    const { data: fromRef } = await octokit.request(`GET /repos/${this[$repository]}/git/refs/heads/${from}`)
    const response = await octokit.request(`POST /repos/${this[$repository]}/git/refs`, {
      ref: `refs/heads/${name}`,
      sha: fromRef.object.sha
    })
    if (response.status !== 201) {
      throw new Error('Not able to create branch')
    }
    if (options.verbose) {
      console.log(`Branch ${name} created.`)
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
    if (options.verbose) {
      console.log(`Cloning ${this[$repository]}...`)
    }
    const { data: repo } = await octokit.request(`GET /repos/${this[$repository]}`)
    this[$clone] = join(options.work, this[$repository])
    const cloneUrl = repo.clone_url.replace(/^https:\/\//, `https://${user.login}:${options.auth}@`)
    await git('clone', cloneUrl, this[$repository])
    if (options.verbose) {
      console.log(`Cloned ${this[$repository]}, configuring...`)
    }
    this[$git] = gitFactory(this[$clone])
    this.git('config', '--local', '--add', 'user.name', user.login)
    this.git('config', '--local', '--add', 'user.email', user.email)
    if (options.verbose) {
      console.log(`Cloned and configured ${this[$repository]}.`)
    }
  }

  async git (...args) {
    await this.clone()
    return await this[$git](...args)
  }

  async hasChanges () {
    await this.clone()
    const { stdout } = await this.git('status', '--porcelain')
    return stdout.trim() !== ''
  }

  async pushStash () {
    await this.git('stash', 'push')
  }

  async popStash () {
    try {
      await this.git('stash', 'pop')
    } catch (reason) {
      if (reason.stderr.includes('No stash entries found.')) {
        console.error(reason.stderr)
        console.warn('Ignoring error (maybe you created new files)')
      } else {
        throw reason
      }
    }
  }

  async checkout (branchName = 'main') {
    await this.git('fetch')
    await this.git('checkout', branchName)
  }

  async exists (filename) {
    await this.clone()
    try {
      await access(join(this[$clone], filename))
      return true
    } catch (e) {
      return false
    }
  }

  async readFile (filename) {
    await this.clone()
    return (await readFile(join(this[$clone], filename))).toString()
  }

  async writeFile (filename, content) {
    await this.clone()
    return await writeFile(join(this[$clone], filename), content)
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
