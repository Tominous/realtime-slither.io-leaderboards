let Client = require('slitherode')
let WebSocket = require('ws')

function isLeft(start, end, point) {
  return (
    (end.x - start.x) * (point.y - start.y) -
      (end.y - start.y) * (point.x - start.x) >
    0
  )
}

class Bot {
  constructor(ip, port, nickname, skin, expressWsInstance) {
    this.expressWsInstance = expressWsInstance

    this.spawn(`ws://${ip}:${port}/slither`, nickname, skin)
  }

  spawn(url, nickname, skin) {
    this.speedingEnabled = false
    this.client = new Client(url, nickname, skin)

    this.client
      .on('leaderboard', this.handleLeaderboard.bind(this))
      .on('minimap', this.handleMinimap.bind(this))
      .on('move', this.handleMove.bind(this))
      .on('add snake', this.handleAddSnake.bind(this))
  }

  sortedFoodIds() {
    let me = this.client.snakes[this.client.snakeId]
    let self = this

    return Object.keys(this.client.foods).sort(function(aId, bId) {
      let a = self.client.foods[aId]
      let b = self.client.foods[bId]
      let aDistance = Math.abs(a.x - me.x) + Math.abs(a.y - me.y)
      let bDistance = Math.abs(b.x - me.x) + Math.abs(b.y - me.y)

      return aDistance - bDistance
    })
  }

  handleLeaderboard(botRank, totalPlayers, leaderboard) {
    let connectedSockets = [...this.expressWsInstance.getWss().clients].filter(
      function(socket) {
        return socket.readyState === WebSocket.OPEN
      }
    )

    if (connectedSockets.length === 0) return

    let server = /ws:\/\/(.*)\/slither/.exec(this.client.socket.url)[1]
    let buffer = Buffer.alloc(6 + server.length)

    let offset = buffer.writeUInt8(0, 0)
    offset = buffer.writeUInt8(server.length, offset)
    offset += buffer.write(server, offset)
    offset = buffer.writeUInt16BE(botRank, offset)

    buffer.writeUInt16BE(totalPlayers, offset)

    for (let index = 0; index < 10; index++) {
      let snake = leaderboard[index]
      let snakeBuffer = Buffer.alloc(4 + snake.nickname.length)

      let snakeBufferOffset = snakeBuffer.writeUInt8(snake.nickname.length, 0)

      snakeBufferOffset += snakeBuffer.write(snake.nickname, snakeBufferOffset)

      snakeBuffer.writeUIntBE(snake.length, snakeBufferOffset, 3)

      buffer = Buffer.concat([buffer, snakeBuffer])
    }

    for (let socket of connectedSockets) {
      socket.send(buffer)
    }
  }

  handleMinimap(minimap) {
    let connectedSockets = [...this.expressWsInstance.getWss().clients].filter(
      function(socket) {
        return socket.readyState === WebSocket.OPEN
      }
    )

    if (connectedSockets.length === 0) return

    let server = /ws:\/\/(.*)\/slither/.exec(this.client.socket.url)[1]
    let buffer = Buffer.alloc(2 + server.length)

    let offset = buffer.writeUInt8(1, 0)
    offset = buffer.writeUInt8(server.length, offset)

    buffer.write(server, offset)

    buffer = Buffer.concat([buffer, Buffer.from(minimap)])

    for (let socket of connectedSockets) {
      socket.send(buffer)
    }
  }

  handleMove(id) {
    if (id !== this.client.snakeId) return

    let connectedSockets = [...this.expressWsInstance.getWss().clients].filter(
      function(socket) {
        return socket.readyState === WebSocket.OPEN
      }
    )

    if (connectedSockets.length === 0) return

    let snake = this.client.snakes[id]
    let server = /ws:\/\/(.*)\/slither/.exec(this.client.socket.url)[1]
    let buffer = Buffer.alloc(8 + server.length)

    let offset = buffer.writeUInt8(2, 0)
    offset = buffer.writeUInt8(server.length, offset)
    offset += buffer.write(server, offset)
    offset = buffer.writeUInt16BE(snake.x, offset)
    offset = buffer.writeUInt16BE(snake.y, offset)

    buffer.writeUInt16BE(this.client.length(id), offset)

    for (let socket of connectedSockets) {
      socket.send(buffer)
    }
  }

  handleAddSnake(id) {
    if (id !== this.client.snakeId) {
      return
    }

    let self = this

    ;(function loop() {
      let me = self.client.snakes[self.client.snakeId]

      if (typeof me === 'undefined') {
        self.spawn(
          self.client.socket.url,
          self.client.nickname,
          self.client.skin
        )

        return
      }

      let parts = Object.keys(self.client.snakes)
        .filter(function(id) {
          return Number(id) !== self.client.snakeId
        })
        .reduce(function(array, snakeId) {
          let snake = self.client.snakes[snakeId]

          let parts = snake.body.map(function(part) {
            return Object.assign(part, {
              snakeId: Number(snakeId),
              distance: Math.abs(part.x - me.x) + Math.abs(part.y - me.y)
            })
          })

          array.push(...parts)

          return array
        }, [])
        .filter(function(part) {
          return part.distance < 500
        })
        .sort(function(a, b) {
          return a.distance - b.distance
        })

      if (parts.length !== 0) {
        let part = parts[0]

        if (part.distance < 150) {
          self.client.speeding(true)

          self.client.speedingEnabled = true
        } else if (self.client.speedingEnabled) {
          self.client.speeding(false)

          self.client.speedingEnabled = false
        }

        let cos = Math.cos(Math.PI)
        let sin = Math.sin(Math.PI)
        let myCos = Math.cos(me.angle)
        let mySin = Math.sin(me.angle)

        let end = {
          x: me.x + 2000 * myCos,
          y: me.y + 2000 * mySin
        }

        if (isLeft(me, end, part)) {
          sin = -sin
        }

        self.client.move(
          cos * (part.x - me.x) - sin * (part.y - me.y) + me.x,
          sin * (part.x - me.x) + cos * (part.y - me.y) + me.y
        )
      } else {
        if (self.client.speedingEnabled) {
          self.client.speeding(false)

          self.client.speedingEnabled = false
        }

        let foodIds = self.sortedFoodIds()

        if (foodIds.length > 0) {
          let food = self.client.foods[foodIds[0]]

          self.client.move(food.x, food.y)
        }
      }

      setTimeout(loop, 100)
    })()
  }
}

module.exports = Bot