let got = require('got')

/**
 * Gets the server list
 *
 * @returns {Promise} a array of objects with following properties:
 *  ip: string
 *  port: number
 */
module.exports = async function getServers () {
  let res = await got('http://slither.io/i33628.txt')
  let servers = []
  let dropped = res.body.split('').slice(1)

  let converted = dropped.map(function (c) {
    return c.charCodeAt(0) - 97
  })

  let substracted = converted.map(function (n, i) {
    return n - (7 * i)
  })

  let moduloed = substracted.map(function (n) {
    return (n % 26 + 26) % 26
  })

  let bytes = moduloed.map(function (_n, i) {
    return moduloed[i * 2] * 16 + moduloed[i * 2 + 1]
  })

  let buf = Buffer.from(bytes)
  let i = 0

  while (i < buf.length) {
    let ip = Array.from(buf.slice(i, i + 4)).join('.')
    i += 4

    let port = buf.readUIntBE(i, 3)
    i += 7

    if (ip !== '0.0.0.0') {
      servers.push({
        ip,
        port
      })
    }
  }

  return servers
}
