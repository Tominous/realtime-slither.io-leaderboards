let ow = require('ow')
let ipPortRegex = require('ip-port-regex')

module.exports = {
  type: 2,
  decode(buffer) {
    ow(buffer, ow.buffer)

    let offset = 1

    let serverLength = buffer.readUInt8(offset)
    offset++

    let server = buffer.toString('utf8', offset, offset + serverLength)

    offset += serverLength

    let x = buffer.readUInt16BE(offset)
    offset += 2

    let y = buffer.readUInt16BE(offset)
    offset += 2

    let length = buffer.readUIntBE(offset, 3)

    return { server, x, y, length }
  },
  encode(server, x, y, length) {
    ow(server, ow.string.matches(ipPortRegex.v4({ exact: true })))
    ow(x, ow.number.uint16)
    ow(y, ow.number.uint16)
    ow(length, ow.number.inRange(0, 16777215))

    let buffer = Buffer.alloc(9 + server.length)

    let offset = buffer.writeUInt8(2, 0)
    offset = buffer.writeUInt8(server.length, offset)
    offset += buffer.write(server, offset)
    offset = buffer.writeUInt16BE(x, offset)
    offset = buffer.writeUInt16BE(y, offset)

    buffer.writeUIntBE(length, offset, 3)

    return buffer
  }
}
