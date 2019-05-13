let express = require('express')
let expressWs = require('express-ws')
let getServers = require('slitherode/get-servers')
let yargs = require('yargs')
let frontend = require('./routes/frontend')
let websocket = require('./routes/websocket')
let Bot = require('./bot')

let options = yargs
  .option('nickname', {
    nargs: 1,
    demandOption: true,
    string: true
  })
  .option('skin', {
    nargs: 1,
    demandOption: true,
    string: true,
    describe: 'Number or array of numbers separated by commas'
  })
  .version(false).argv

if (options.skin.includes(',')) {
  options.skin = Buffer.from(options.skin.split(','))
} else {
  options.skin = Number(options.skin)

  if (isNaN(options.skin)) {
    console.error('Invalid skin')

    process.exit(1)
  }
}

;(async function() {
  let servers = await getServers()
  let application = express()
  let expressWsInstance = expressWs(application)

  application.use(frontend()).use(websocket())

  let listener = await application.listen(process.env.PORT || 3000)

  console.log(`Listening on *:${listener.address().port}`)

  for (let server of servers) {
    new Bot(
      server.ip,
      server.port,
      options.nickname,
      options.skin,
      expressWsInstance
    )
  }
})()
