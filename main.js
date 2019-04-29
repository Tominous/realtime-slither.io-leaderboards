let Client = require('slitherode')
let express = require('express')
let expressWs = require('express-ws')
let getServers = require('./server-list')
let path = require('path')
let WebSocket = require('ws')
let yargs = require('yargs')

;(async function () {
  let options = yargs
    .option('nickname', {
      nargs: 1,
      demandOption: true,
      string: true
    }).option('skin', {
      nargs: 1,
      demandOption: true,
      number: true
    }).version(false)
    .argv

  let servers = await getServers()
  let application = express()
  let expressWsInstance = expressWs(application)

  application.get('/', function (_request, response) {
    response.status(200).sendFile(path.join(__dirname, 'public', 'main.html'))
  }).get('/main.css', function (_request, response) {
    response.status(200).sendFile(path.join(__dirname, 'public', 'main.css'))
  }).get('/main.js', function (_request, response) {
    response.status(200).sendFile(path.join(__dirname, 'public', 'main.js'))
  }).ws('/', function () {
    // do nothing
  })

  let listener = application.listen(process.env.PORT || 3000)
  console.log(`Listening on *:${listener.address().port}`)

  for (let server of servers) {
    spawn(server.ip, server.port)
  }

  function spawn (ip, port) {
    let client = new Client(`ws://${ip}:${port}/slither`, options.nickname, options.skin)

    client.on('leaderboard', function (_ownRank, totalPlayers, leaderboard) {
      let connectedSockets = [...expressWsInstance.getWss().clients].filter(function (socket) {
        return socket.readyState === WebSocket.OPEN
      })

      if (connectedSockets.length === 0) return

      let serverString = `${ip}:${port}`
      let offset = 0
      let buffer = Buffer.alloc(4 + serverString.length)

      buffer.writeUInt8(0, offset)
      offset++

      buffer.writeUInt8(serverString.length, offset)
      offset++

      buffer.write(serverString, offset)
      offset += serverString.length

      buffer.writeUInt16BE(totalPlayers, offset)
      offset += 2

      for (let index = 0; index < 10; index++) {
        let snake = leaderboard[index]
        let snakeBuffer = Buffer.alloc(4 + snake.nickname.length)
        let snakeBufferOffset = 0

        snakeBuffer.writeUInt8(snake.nickname.length, snakeBufferOffset)
        snakeBufferOffset++

        snakeBuffer.write(snake.nickname, snakeBufferOffset)
        snakeBufferOffset += snake.nickname.length

        snakeBuffer.writeUIntBE(snake.length, snakeBufferOffset, 3)
        snakeBufferOffset += 3

        buffer = Buffer.concat([buffer, snakeBuffer])
      }

      for (let socket of connectedSockets) {
        socket.send(buffer)
      }
    }).on('minimap', function (minimap) {
      let connectedSockets = [...expressWsInstance.getWss().clients].filter(function (socket) {
        return socket.readyState === WebSocket.OPEN
      })

      if (connectedSockets.length === 0) return

      let serverString = `${ip}:${port}`
      let offset = 0
      let buffer = Buffer.alloc(2 + serverString.length)

      buffer.writeUInt8(1, offset)
      offset++

      buffer.writeUInt8(serverString.length, offset)
      offset++

      buffer.write(serverString, offset)
      offset += serverString.length

      buffer = Buffer.concat([buffer, Buffer.from(minimap)])

      for (let socket of connectedSockets) {
        socket.send(buffer)
      }
    }).on('dead', function () {
      spawn(ip, port)
    }).on('new highscore of the day', function () {
      spawn(ip, port)
    }).on('v unknown', function () {
      spawn(ip, port)
    })
  }
})()
