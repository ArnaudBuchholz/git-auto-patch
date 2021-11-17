require('dotenv').config()
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
  .option('-w, --work <work>', 'Working folder (cleaned)', './.git-auto-path')
  .option('-v, --verbose', 'Verbose')
  .parse(process.argv)
  .opts()

if (options.verbose) {
  console.log({
    ...options,
    token: options.token ? '[REDACTED]' : ''
  })
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
  const git = gitFactory(options.work)
  const { data: user } = await octokit.request('GET /user')
  console.log(`Connected as ${user.name}`)
  for await (const script of options.script) {
    const patch = require(script)
    await patch(new Wrapper(git, octokit))
  }
}

main()
  .then(() => process.exit(0))
  .catch(reason => {
    console.error(reason)
    process.exit(-1)
  })
