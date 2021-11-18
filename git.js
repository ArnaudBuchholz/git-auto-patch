const util = require('util')
const execFile = util.promisify(require('child_process').execFile)

module.exports = cwd => {
  return async function git (...args) {
    console.log(`${cwd}>git`, ...args.map(arg => {
      const isUrl = arg.match(/^https:\/\/([^:]+):([^@]+)@/)
      if (isUrl) {
        return arg.replace(isUrl[0], `https://${isUrl[1]}:[REDACTED]@`)
      }
      return arg
    }))
    const { stdout, stderr } = await execFile('git', args, { cwd })
    if (stdout) {
      console.log(stdout)
    }
    if (stderr) {
      console.log(stderr)
    }
    return { stdout, stderr }
  }
}
