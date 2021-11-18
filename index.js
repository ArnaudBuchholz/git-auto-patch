require('dotenv').config()
const { mkdir, stat, rm: newRm, rmdir } = require('fs/promises')
const { version } = require('./package.json')
const { program } = require('commander')
const { Octokit } = require('octokit')
const Wrapper = require('./Wrapper')
const gitFactory = require('./git')

const options = program
  .version(version)
  .description('Script to automate github repository patching')
  .option('-h, --host <host>', 'Github host (will be prefixed with https://)', process.env.GIT_AUTO_PATCH_HOST ?? 'api.github.com')
  .option('-p, --path <path>', 'API path', process.env.GIT_AUTO_PATCH_PATH ?? '')
  .requiredOption('-a, --auth <token>', 'Authentification token', process.env.GIT_AUTO_PATCH_AUTH)
  .option('-s, --script <script...>', 'Script(s) to execute')
  .option('-w, --work <work>', 'Working folder (cleaned)', './.git-auto-patch')
  .option('-v, --verbose', 'Verbose')
  .parse(process.argv)
  .opts()

if (options.verbose) {
  console.log({
    ...options,
    auth: options.auth ? '[REDACTED]' : ''
  })
}

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

async function main () {
  if (options.verbose) {
    console.log('Connecting...')
  }
  const octokit = new Octokit({
    auth: options.auth,
    baseUrl: `https://${options.host}${options.path}`
  })
  if (options.verbose) {
    console.log('Cleaning / preparing work folder...')
  }
  await cleanDir(options.work).then(() => mkdir(options.work, recursive))
  const git = gitFactory(options.work)
  const { data: user } = await octokit.request('GET /user')
  const context = {
    options,
    octokit,
    git,
    user
  }
  console.log(`Connected as ${user.name} (${user.login})`)
  for await (const script of options.script) {
    const patch = require(script)
    await patch(new Wrapper(context))
  }
}

main()
  .then(() => 0)
  .catch(reason => {
    console.error(reason)
    return -1
  })
  .then(async code => {
    // await cleanDir(options.work)
    process.exit(code)
  })
