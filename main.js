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

    client.on('leaderboard', function (botRank, totalPlayers, leaderboard) {
      let connectedSockets = [...expressWsInstance.getWss().clients].filter(function (socket) {
        return socket.readyState === WebSocket.OPEN
      })

      if (connectedSockets.length === 0) return

      let serverString = `${ip}:${port}`
      let buffer = Buffer.alloc(6 + serverString.length)

      // eslint-disable-next-line no-unused-vars
      let offset = buffer.writeUInt8(0, 0)
      offset = buffer.writeUInt8(serverString.length, offset)
      offset += buffer.write(serverString, offset)
      offset = buffer.writeUInt16BE(botRank, offset)
      offset = buffer.writeUInt16BE(totalPlayers, offset)

      for (let index = 0; index < 10; index++) {
        let snake = leaderboard[index]
        let snakeBuffer = Buffer.alloc(4 + snake.nickname.length)

        let snakeBufferOffset = snakeBuffer.writeUInt8(snake.nickname.length, 0)
        snakeBufferOffset += snakeBuffer.write(snake.nickname, snakeBufferOffset)
        snakeBufferOffset = snakeBuffer.writeUIntBE(snake.length, snakeBufferOffset, 3)

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
      let buffer = Buffer.alloc(2 + serverString.length)

      // eslint-disable-next-line no-unused-vars
      let offset = buffer.writeUInt8(1, 0)
      offset = buffer.writeUInt8(serverString.length, offset)
      offset += buffer.write(serverString, offset)

      buffer = Buffer.concat([buffer, Buffer.from(minimap)])

      for (let socket of connectedSockets) {
        socket.send(buffer)
      }
    }).on('move', function (id) {
      if (id === client.snakeId) {
        let connectedSockets = [...expressWsInstance.getWss().clients].filter(function (socket) {
          return socket.readyState === WebSocket.OPEN
        })

        if (connectedSockets.length === 0) return

        let snake = client.snakes[id]

        let serverString = `${ip}:${port}`
        let buffer = Buffer.alloc(6 + serverString.length)

        // eslint-disable-next-line no-unused-vars
        let offset = buffer.writeUInt8(2, 0)
        offset = buffer.writeUInt8(serverString.length, offset)
        offset += buffer.write(serverString, offset)
        offset = buffer.writeUInt16BE(snake.x, offset)
        offset = buffer.writeUInt16BE(snake.y, offset)

        for (let socket of connectedSockets) {
          socket.send(buffer)
        }
      }
    }).on('add snake', function (id) {
      if (id === client.snakeId) {
        (function loop () {
          if (!client.connected || !client.snakes[client.snakeId]) return spawn(ip, port)

          let me = client.snakes[client.snakeId]

          let goAway = Object.keys(client.snakes).filter(function (id) {
            if (Number(id) === client.snakeId) return false

            let other = client.snakes[id]
            let distance = Math.abs(Math.round(other.x - me.x)) + Math.abs(Math.round(other.y - me.y))

            return distance < 300
          }).sort(function (a, b) {
            let distanceA = Math.abs(Math.round(a.x - me.x)) + Math.abs(Math.round(a.y - me.y))
            let distanceB = Math.abs(Math.round(b.x - me.x)) + Math.abs(Math.round(b.y - me.y))

            return distanceA - distanceB
          })

          if (goAway.length !== 0) {
            let snake = client.snakes[goAway[0]]

            client.move(-snake.x, -snake.y)
          } else {
            let foods = Object.values(client.foods).sort(function (a, b) {
              let distanceA = Math.abs(Math.round(a.x - me.x)) + Math.abs(Math.round(a.y - me.y))
              let distanceB = Math.abs(Math.round(b.x - me.x)) + Math.abs(Math.round(b.y - me.y))

              return distanceA - distanceB
            })

            if (foods.length > 0) {
              let food = foods[0]

              client.move(food.x, food.y)
            }
          }

          setTimeout(loop, 100)
        })()
      }
    })
  }
})()
