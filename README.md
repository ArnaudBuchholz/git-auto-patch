# git-auto-patch
Script to automate github repository patching.

This environment automates connection, cloning for manipulating files, branching and pull request creation.

## Usage

* Use `git-auto-patch --help` to see option details
* `git-auto-patch -a github_personal_token -s ./your_patch_script` to execute patch script with the given authentication token

WARNING : it is recommended to use **short lived** authentication tokens as it will be serialized and can be retreived.

## API

The `github` object passed to the script offers the following methods :
* `repository (name)` : returns an object representing the repository, name might be `{org}/{repo}` or `{user}/{repo}`

The `repository` object exposes :
* `async createBranch (name, from = 'main')` : creates a branch
* `cloned` : returns `true` if the repository is cloned locally
* `async clone ()` : clones the repository locally
* `async git (...args)` : (⏬) execute the git command
* `async checkout (branchName = 'main')` : (⏬) switch to the given branch
* `async readFile (filename)` : (⏬) read the repository text file
* `async writeFile (filename, content)` : (⏬) overwrite the repository text file with the given content
* `async commitAllAndPush (message)` : (⏬) stage all changed files, commit them (with the given message) and push
* `async commitAllAndPush (title, body, head, base = 'main')` : create a pull request

⏬ : Before executing the command, the repository is cloned locally (if not already cloned)

## Sample patch script

```javascript
module.exports = async github => {
  const repository = github.repository('ArnaudBuchholz/SampleProject')
  const branchName = `patch-${new Date().toISOString().replace(/:|T|\.|z/ig, '')}`
  await repository.createBranch(branchName, 'main')
  await repository.checkout(branchName)
  const sampleContent = await repository.readFile('sample.txt')
  await repository.writeFile('sample.txt', sampleContent + `\n${branchName}`)
  await repository.commitAllAndPush('This is a sample message')
  await repository.createPullRequest('Pull request title', 'pull request description', branchName, 'main')
}
```
