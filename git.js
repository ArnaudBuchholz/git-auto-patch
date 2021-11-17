const { execFile } = require('child_process')
const { mkdir, stat, rm: newRm, rmdir } = require('fs/promises')

const rm = newRm ?? rmdir
const recursive = { recursive: true }

async function cleanDir (dir) {
  try {
    await stat(dir)
    await rm(dir, recursive)
  } catch (err) {
    // Ignore
  }
}

function append (chunk) {
  this.push(chunk.toString())
}

module.exports = async cwd => {
  await cleanDir(cwd).then(() => mkdir(cwd, recursive))
  return function git (...args) {
    return new Promise((resolve, reject) => {
      const cmd = execFile('git', args, { cwd })
      const stdout = []
      const stderr = []
      cmd.stdout.on('data', append.bind(stdout))
      cmd.stderr.on('data', append.bind(stderr))
      cmd.on('error', reject)
      cmd.on('close', () => resolve({ stdout: stdout.join(''), stderr: stderr.join('') }))
    })
  }
}
