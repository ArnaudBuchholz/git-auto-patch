const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')

module.exports = async git => {
  const projects = [
    'git-auto-patch'
  ]
  for await (const projectName of projects) {
    const repository = git.repository(`ArnaudBuchholz/${projectName}`)
    const branchName = `patch-${new Date().toISOString().replace(/:|T|\.|z/ig, '')}`
    await repository.createBranch(branchName, 'main')
    const path = await repository.clone(branchName)
    const sampleContent = (await readFile(join(path, 'sample.txt'))).toString()
    await writeFile(join(path, 'sample.txt'), sampleContent + `\n${branchName}`)
    await repository.commitAllAndPush('This is a sample message')
    await repository.createPullRequest(branchName, 'main')
  }
}
