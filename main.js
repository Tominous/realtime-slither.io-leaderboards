let express = require('express')
let expressWs = require('express-ws')
let slitherode = require('slitherode')
let yargs = require('yargs')
let frontend = require('./routes/frontend')
let websocket = require('./routes/websocket')
let Bot = require('./bot')
let other = require('./routes/other')

require('dotenv').config()

let options = yargs
  .env('RSL')
  .option('nickname', {
    nargs: 1,
    string: true
  })
  .option('skin', {
    nargs: 1,
    string: true,
    describe: 'Number or array of numbers separated by commas'
  })
  .version(false).argv

if (options.skin.includes(',')) {
  options.skin = Buffer.from(options.skin.split(','))
} else {
  options.skin = +options.skin

  if (isNaN(options.skin)) {
    console.error('Invalid skin')

    process.exit(1)
  }
}

;(async function() {
  let servers = await slitherode.servers()
  let application = express()

  let expressWsInstance = expressWs(application)

  application.use(frontend(), websocket(), await other())

  let listener = await application.listen(process.env.PORT || 3000)

  console.log(`Listening on *:${listener.address().port}`)

  for (let server of servers) {
    ;(function spawn() {
      let bot = new Bot(server, options, expressWsInstance)

      bot.client.socket.on('close', spawn)
    })()
  }
})()
