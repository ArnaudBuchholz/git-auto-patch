module.exports = async git => {
  const projects = [
    'git-auto-patch'
  ]
  for await (const projectName of projects) {
    const repository = git.repository(`ArnaudBuchholz/${projectName}`)
    const branchName = `patch-${new Date().toISOString().replace(/:|T|\.|z/ig, '')}`
    await repository.createBranch(branchName, 'main')
    await repository.checkout(branchName)
    const sampleContent = await repository.readFile('sample.txt')
    await repository.writeFile('sample.txt', sampleContent + `\n${branchName}`)
    await repository.commitAllAndPush('This is a sample message')
    await repository.createPullRequest('Pull request title', 'pull request description', branchName, 'main')
  }
}
