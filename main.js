let Client = require('slitherode')
let express = require('express')
let expressWs = require('express-ws')
let getServers = require('slitherode/get-servers')
let path = require('path')
let WebSocket = require('ws')
let yargs = require('yargs')

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

  application
    .get('/', function(_request, response) {
      response.status(200).sendFile(path.join(__dirname, 'public', 'main.html'))
    })
    .get('/main.css', function(_request, response) {
      response.status(200).sendFile(path.join(__dirname, 'public', 'main.css'))
    })
    .get('/main.js', function(_request, response) {
      response.status(200).sendFile(path.join(__dirname, 'public', 'main.js'))
    })
    .ws('/', function() {
      // do nothing
    })

  let listener = application.listen(process.env.PORT || 3000)

  console.log(`Listening on *:${listener.address().port}`)

  for (let server of servers) {
    spawn(server.ip, server.port)
  }

  function spawn(ip, port) {
    let client = new Client(
      `ws://${ip}:${port}/slither`,
      options.nickname,
      options.skin
    )

    client
      .on('leaderboard', function(botRank, totalPlayers, leaderboard) {
        let connectedSockets = [...expressWsInstance.getWss().clients].filter(
          function(socket) {
            return socket.readyState === WebSocket.OPEN
          }
        )

        if (connectedSockets.length === 0) return

        let serverString = `${ip}:${port}`
        let buffer = Buffer.alloc(6 + serverString.length)

        let offset = buffer.writeUInt8(0, 0)
        offset = buffer.writeUInt8(serverString.length, offset)
        offset += buffer.write(serverString, offset)
        offset = buffer.writeUInt16BE(botRank, offset)

        buffer.writeUInt16BE(totalPlayers, offset)

        for (let index = 0; index < 10; index++) {
          let snake = leaderboard[index]
          let snakeBuffer = Buffer.alloc(4 + snake.nickname.length)

          let snakeBufferOffset = snakeBuffer.writeUInt8(
            snake.nickname.length,
            0
          )

          snakeBufferOffset += snakeBuffer.write(
            snake.nickname,
            snakeBufferOffset
          )

          snakeBuffer.writeUIntBE(snake.length, snakeBufferOffset, 3)

          buffer = Buffer.concat([buffer, snakeBuffer])
        }

        for (let socket of connectedSockets) {
          socket.send(buffer)
        }
      })
      .on('minimap', function(minimap) {
        let connectedSockets = [...expressWsInstance.getWss().clients].filter(
          function(socket) {
            return socket.readyState === WebSocket.OPEN
          }
        )

        if (connectedSockets.length === 0) return

        let serverString = `${ip}:${port}`
        let buffer = Buffer.alloc(2 + serverString.length)

        let offset = buffer.writeUInt8(1, 0)
        offset = buffer.writeUInt8(serverString.length, offset)

        buffer.write(serverString, offset)

        buffer = Buffer.concat([buffer, Buffer.from(minimap)])

        for (let socket of connectedSockets) {
          socket.send(buffer)
        }
      })
      .on('move', function(id) {
        if (id !== client.snakeId) return

        let connectedSockets = [...expressWsInstance.getWss().clients].filter(
          function(socket) {
            return socket.readyState === WebSocket.OPEN
          }
        )

        if (connectedSockets.length === 0) return

        let snake = client.snakes[id]
        let serverString = `${ip}:${port}`
        let buffer = Buffer.alloc(8 + serverString.length)

        let offset = buffer.writeUInt8(2, 0)
        offset = buffer.writeUInt8(serverString.length, offset)
        offset += buffer.write(serverString, offset)
        offset = buffer.writeUInt16BE(snake.x, offset)
        offset = buffer.writeUInt16BE(snake.y, offset)

        buffer.writeUInt16BE(client.length(id), offset)

        for (let socket of connectedSockets) {
          socket.send(buffer)
        }
      })
  }
})()
