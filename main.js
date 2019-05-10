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
      .on('add snake', function(id) {
        if (id !== client.snakeId) {
          return
        }

        ;(function loop() {
          let me = client.snakes[client.snakeId]

          if (typeof me === 'undefined') return spawn(ip, port)

          let bodyParts = Object.keys(client.snakes)
            .filter(function(id) {
              return Number(id) !== client.snakeId
            })
            .reduce(function(array, snakeId) {
              let snake = client.snakes[snakeId]

              let snakeBodyParts = snake.body.map(function(part) {
                return Object.assign(part, {
                  snakeId: Number(snakeId),
                  distance: Math.abs(part.x - me.x) + Math.abs(part.y - me.y)
                })
              })

              array.push(...snakeBodyParts)

              return array
            }, [])
            .filter(function(part) {
              return part.distance < 500
            })
            .sort(function(a, b) {
              return a.distance - b.distance
            })

          if (bodyParts.length !== 0) {
            let part = bodyParts[0]

            if (part.distance < 150) {
              client.speeding(true)
            } else if (part.distance < 300) {
              client.speeding(false)
            }

            let myCos = Math.cos(me.angle)
            let mySin = Math.sin(me.angle)

            let end = {
              x: me.x + 2000 * myCos,
              y: me.y + 2000 * mySin
            }

            let cos = Math.cos(Math.PI)
            let sin = Math.sin(Math.PI)

            function isLeft(start, end, point) {
              return (
                (end.x - start.x) * (point.y - start.y) -
                  (end.y - start.y) * (point.x - start.x) >
                0
              )
            }

            if (isLeft(me, end, part)) {
              sin = -sin
            }

            client.move(
              cos * (part.x - me.x) - sin * (part.y - me.y) + me.x,
              sin * (part.x - me.x) + cos * (part.y - me.y) + me.y
            )
          } else {
            let foods = Object.values(client.foods).sort(function(a, b) {
              let aDistance = Math.abs(a.x - me.x) + Math.abs(a.y - me.y)
              let bDistance = Math.abs(b.x - me.x) + Math.abs(b.y - me.y)

              return aDistance - bDistance
            })

            if (foods.length > 0) {
              let food = foods[0]

              client.move(food.x, food.y)
            }
          }

          setTimeout(loop, 100)
        })()
      })
  }
})()
