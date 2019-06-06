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

    let positions = []

    while (offset < buffer.length) {
      let x = buffer.readUInt8(offset)
      offset++

      let y = buffer.readUInt8(offset)
      offset++

      positions.push([x, y])
    }

    return { server, positions }
  },
  encode(server, minimap) {
    ow(server, ow.string.matches(ipPortRegex.v4({ exact: true })))
    ow(minimap, ow.array.length(80 * 80))

    let buffer = Buffer.alloc(
      minimap.reduce(function(previousValue, value) {
        return value ? previousValue + 2 : previousValue
      }, 2 + server.length)
    )

    let offset = buffer.writeUInt8(1, 0)
    offset = buffer.writeUInt8(server.length, offset)
    offset += buffer.write(server, offset)

    for (let index = 0; index < minimap.length; index++) {
      if (minimap[index]) {
        offset = buffer.writeUInt8((index % 80) + 80 - 80 + 12, offset)
        offset = buffer.writeUInt8(index / 80 + 80 - 80 + 12, offset)
      }
    }

    return buffer
  }
}
