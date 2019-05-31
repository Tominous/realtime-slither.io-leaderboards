let Client = require('slitherode')
let WebSocket = require('ws')

class Bot {
  constructor(server, options, expressWsInstance) {
    this.expressWsInstance = expressWsInstance
    this.speedingEnabled = false

    this.client = new Client(
      `ws://${server.ip}:${server.port}/slither`,
      options.nickname,
      options.skin
    )
      .on('leaderboard', this.handleLeaderboard.bind(this))
      .on('minimap', this.handleMinimap.bind(this))
      .on('move', this.handleMove.bind(this))
      .on('dead', this.handleDead.bind(this))

    this.client.socket.on('error', function() {})
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

    let me = this.client.snakes[id]
    let self = this

    let parts = Object.keys(this.client.snakes)
      .filter(function(snakeId) {
        return Number(snakeId) !== id
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
        if (!this.speedingEnabled) {
          this.client.speeding(true)

          this.speedingEnabled = true
        }
      } else if (this.speedingEnabled) {
        this.client.speeding(false)

        this.speedingEnabled = false
      }

      let cos = Math.cos(Math.PI)
      let sin = Math.sin(Math.PI)
      let angleCos = Math.cos(me.angle)
      let angleSin = Math.sin(me.angle)

      let end = {
        x: me.x + 2000 * angleCos,
        y: me.y + 2000 * angleSin
      }

      if (
        (end.x - me.x) * (part.y - me.y) - (end.y - me.y) * (part.x - me.x) >
        0
      ) {
        sin = -sin
      }

      this.client.move(
        cos * (part.x - me.x) - sin * (part.y - me.y) + me.x,
        sin * (part.x - me.x) + cos * (part.y - me.y) + me.y
      )
    } else {
      if (this.speedingEnabled) {
        this.client.speeding(false)

        this.speedingEnabled = false
      }

      let foodIds = Object.keys(this.client.foods).sort(function(aId, bId) {
        let a = self.client.foods[aId]
        let b = self.client.foods[bId]
        let aDistance = Math.abs(a.x - me.x) + Math.abs(a.y - me.y)
        let bDistance = Math.abs(b.x - me.x) + Math.abs(b.y - me.y)

        return aDistance - bDistance
      })

      if (foodIds.length > 0) {
        let food = this.client.foods[foodIds[0]]

        this.client.move(food.x, food.y)
      }
    }

    let connectedSockets = [...this.expressWsInstance.getWss().clients].filter(
      function(socket) {
        return socket.readyState === WebSocket.OPEN
      }
    )

    if (connectedSockets.length === 0) return

    let server = /ws:\/\/(.*)\/slither/.exec(this.client.socket.url)[1]
    let buffer = Buffer.alloc(9 + server.length)

    let offset = buffer.writeUInt8(2, 0)
    offset = buffer.writeUInt8(server.length, offset)
    offset += buffer.write(server, offset)
    offset = buffer.writeUInt16BE(me.x, offset)
    offset = buffer.writeUInt16BE(me.y, offset)

    buffer.writeUIntBE(this.client.length(id), offset, 3)

    for (let socket of connectedSockets) {
      socket.send(buffer)
    }
  }

  handleDead(notClosed) {
    if (notClosed) this.client.socket.close()
  }
}

module.exports = Bot
