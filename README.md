# git-auto-patch

Script to automate github repository patching : it automates connection, cloning for manipulating files, branching and pull request creation.

## Usage

* Use `git-auto-patch --help` to see option details
* `git-auto-patch -a github_personal_token -s ./your_patch_script` to execute patch script with the given authentication token

**WARNING** : it is recommended to use **short lived** authentication tokens as they are **serialized** and can be **retreived**.

## API

The `github` object passed to the script offers the following methods :
* `async get (url) ` : triggers an API REST GET request to github, full response is returned
* `repository (name)` : returns an object representing the repository, name might be `{org}/{repo}` or `{user}/{repo}`

The `repository` object exposes :
* `async createBranch (name, from = 'main')` : creates a branch *(the branch is created using github API, clone the repository **after** creating the branch or you won't get it)*
* `cloned` : `true` if the repository is cloned locally
* `async clone ()` : clones the repository locally *(in a working folder)*
* `async git (...args)` : (⏬) execute the git command
* `async hasChanges ()` : (⏬) `true` if the repository has changes (based on `git status`)
* `async pushStash ()` : (⏬) stash the changes
* `async popStash ()` : (⏬) restore the stashed changes *(ignore the error if no stash exists)*
* `async checkout (branchName = 'main')` : (⏬ & fetch) switch to the given branch
* `async exists (filename)` : (⏬📂) `true` if the repository file (or folder) exists
* `async readFile (filename)` : (⏬📂) read the repository text file
* `async writeFile (filename, content)` : (⏬📂) overwrite the repository text file with the given content
* `async commitAllAndPush (message)` : (⏬) stage all changed files, commit them *(with the given message)* and push
* `async createPullRequest (title, body, head, base = 'main')` : create a pull request

⏬ : Before executing the command, the repository is cloned locally (if not already cloned)
📂 : Filename is relative to the root of the repository

## Sample patch scripts

* In this example, a change **is** made *(because of the file concatenation)*, hence the branch is created **first**.

```javascript
module.exports = async (github, ...customParameters) => {
  const repository = github.repository('ArnaudBuchholz/SampleProject')
  const branchName = `patch-${new Date().toISOString().replace(/-|T|:|\.|z/ig, '')}`
  await repository.createBranch(branchName, 'main')
  await repository.checkout(branchName)
  const sampleContent = await repository.readFile('sample.txt')
  await repository.writeFile('sample.txt', sampleContent + `\n${branchName}`)
  await repository.commitAllAndPush('This is a sample message')
  await repository.createPullRequest('Pull request title', 'pull request description', branchName, 'main')
}
```

* In this example, `hasChanges()` **checks** if the patch generates a change. A **stash** saves and restores the change while switching to the new branch. The value parameter is specified on the command line using `-c`.

```javascript
module.exports = async (github, value) => {
  if (value === undefined) {
    console.error('Use -c <value>')
    return
  }
  const repository = github.repository('ArnaudBuchholz/git-auto-patch-sample')
  await repository.writeFile('value.txt', value)
  if (await repository.hasChanges()) {
    await repository.pushStash() // save changes (not if we created a new file)
    const branchName = `patch-${new Date().toISOString().replace(/-|T|:|\.|z/ig, '')}`
    await repository.createBranch(branchName, 'main')
    await repository.checkout(branchName) // Will fetch first
    await repository.popStash() // restore changes (not if it was a new file)
    await repository.commitAllAndPush('Update of value')
    await repository.createPullRequest('Example of value update', `**value** : ${value}`, branchName, 'main')
  } else {
    console.log('No change !')
  }
}
```
