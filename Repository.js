const { $git, $octokit, $repository } = require('./symbols')

module.exports = class Repository {
  async createBranch (name, from = 'main') {
    const { data: fromRef } = await this[$octokit].request(`GET /repos/${this[$repository]}/git/refs/heads/${from}`)
    const response = await this[$octokit].request(`POST /repos/${this[$repository]}/git/refs`, {
      ref: `refs/heads/${name}`,
      sha: fromRef.object.sha
    })
    if (response.status !== 201) {
      throw new Error('Not able to create branch')
    }
  }

  async clone (branchName = 'main') {
    const { data: repo } = await this[$octokit].request(`GET /repos/${this[$repository]}`)
    console.log(repo.clone_url)
    // this[$git]('clone', '')
    throw new Error('Not implemented')
  }

  constructor (git, octokit, repositoryName) {
    this[$git] = git
    this[$octokit] = octokit
    this[$repository] = repositoryName
  }
}
