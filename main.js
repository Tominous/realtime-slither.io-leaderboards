let Client = require('slitherode')
let express = require('express')
let expressWs = require('express-ws')
let getServers = require('./serverlist')
let path = require('path')
let WebSocket = require('ws')
let yargs = require('yargs')

;(async function () {
  let args = yargs
    .option('nickname', {
      nargs: 1,
      demandOption: true,
      string: true
    }).option('skin', {
      nargs: 1,
      demandOption: true,
      number: true
    }).argv

  let servers = await getServers()
  let app = express()
  let wsInstance = expressWs(app)

  app.get('/', function (_req, res) {
    res.status(200).sendFile(path.join(__dirname, 'public', 'index.html'))
  }).get('/main.css', function (_req, res) {
    res.status(200).sendFile(path.join(__dirname, 'public', 'main.css'))
  }).get('/main.js', function (_req, res) {
    res.status(200).sendFile(path.join(__dirname, 'public', 'main.js'))
  }).ws('/', function () {
    // do nothing
  }).listen(process.env.PORT || 3000, function () {
    for (let server of servers) {
      spawn(server.ip, server.port)
    }

    console.log(`Listening on *:${this.address().port}`)
  })

  function spawn (ip, port) {
    let client = new Client(`ws://${ip}:${port}/slither`, args.nickname, args.skin)

    client.on('leaderboard', function (_ownRank, totalPlayers, leaderboard) {
      let clients = [...wsInstance.getWss().clients].filter(function (ws) {
        return ws.readyState === WebSocket.OPEN
      })

      if (clients.length === 0) return

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

      for (let i = 0; i < 10; i++) {
        let snake = leaderboard[i]
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

      for (let ws of clients) {
        ws.send(buffer)
      }
    }).on('minimap', function (minimap) {
      let clients = [...wsInstance.getWss().clients].filter(function (ws) {
        return ws.readyState === WebSocket.OPEN
      })

      if (clients.length === 0) return

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

      for (let ws of clients) {
        ws.send(buffer)
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
