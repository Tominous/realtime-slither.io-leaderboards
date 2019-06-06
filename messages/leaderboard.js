let ow = require('ow')
let ipPortRegex = require('ip-port-regex')

module.exports = {
  decode(buffer) {
    ow(buffer, ow.buffer)

    let offset = 1

    let serverLength = buffer.readUInt8(offset)
    offset++

    let server = buffer.toString('utf8', offset, offset + serverLength)

    offset += serverLength

    let leaderboard = []

    let botRank = buffer.readUInt16BE(offset)
    offset += 2

    let totalPlayers = buffer.readUInt16BE(offset)
    offset += 2

    while (offset < buffer.length) {
      let nicknameLength = buffer.readUInt8(offset)
      ow(nicknameLength, ow.number.integer.inRange(0, 26))

      offset++

      let nickname = buffer.toString('utf8', offset, offset + nicknameLength)
      offset += nicknameLength

      let length = buffer.readUIntBE(offset, 3)
      offset += 3

      leaderboard.push({
        nickname,
        length
      })
    }

    return { server, botRank, totalPlayers, leaderboard }
  },
  encode(server, botRank, totalPlayers, leaderboard) {
    ow(server, ow.string.matches(ipPortRegex.v4({ exact: true })))
    ow(botRank, ow.number.uint16)
    ow(totalPlayers, ow.number.uint16)
    ow(
      leaderboard,
      ow.array.length(10).ofType(
        ow.object.exactShape({
          nickname: ow.string.maxLength(26),
          length: ow.number.integer.inRange(0, 16777215),
          fontColor: ow.number.integer.inRange(0, 8)
        })
      )
    )

    let buffer = Buffer.alloc(
      leaderboard.reduce(function(previousValue, snake) {
        return previousValue + snake.nickname.length
      }, 46 + server.length)
    )

    let offset = buffer.writeUInt8(0, 0)
    offset = buffer.writeUInt8(server.length, offset)
    offset += buffer.write(server, offset)
    offset = buffer.writeUInt16BE(botRank, offset)
    offset = buffer.writeUInt16BE(totalPlayers, offset)

    for (let index = 0; index < 10; index++) {
      let snake = leaderboard[index]

      offset = buffer.writeUInt8(snake.nickname.length, offset)
      offset += buffer.write(snake.nickname, offset)
      offset = buffer.writeUIntBE(snake.length, offset, 3)
    }

    return buffer
  }
}
