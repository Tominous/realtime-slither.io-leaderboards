(async function () {
  let args = require('yargs')
    .option('nickname', {
      nargs: 1,
      demandOption: true,
      string: true
    }).option('skin', {
      nargs: 1,
      demandOption: true,
      number: true
    }).argv

  let Client = require('slio')

  let WebSocket = require('ws')

  let expressWs = require('express-ws')(require('express')())

  let path = require('path')

  let servers = await require('./serverlist.js')()

  expressWs.app.get('/', function (req, res) {
    res.status(200).sendFile(path.join(__dirname, 'public', 'index.html'))
  }).get('/main.css', function (req, res) {
    res.status(200).sendFile(path.join(__dirname, 'public', 'main.css'))
  })
    .get('/main.js', function (req, res) {
      res.status(200).sendFile(path.join(__dirname, 'public', 'main.js'))
    })
    .ws('/', function (ws) {})
    .listen(process.env.PORT || 3000, function () {
      for (let server of servers) {
        spawn(server.ip, server.port)
      }

      console.log(`Listening on *:${this.address().port}`)
    })

  function spawn (ip, port) {
    let client = new Client(`ws://${ip}:${port}/slither`, args.nickname, args.skin)

    client.on('leaderboard', function (_or, totalPlayers, leaderboard) {
      let clients = [...expressWs.getWss().clients].filter(function (ws) {
        return ws.readyState === WebSocket.OPEN
      })

      if (clients.length === 0) return

      let s = `${ip}:${port}`
      let o = 0

      let buf = Buffer.alloc(4 + s.length)

      buf.writeUInt8(0, o)
      o++

      buf.writeUInt8(s.length, o)
      o++

      buf.write(s, o, s.length)
      o += s.length

      buf.writeUInt16BE(totalPlayers, o)
      o += 2

      for (let i = 0; i < 10; i++) {
        let info = leaderboard[i]
        let infobuf = Buffer.alloc(4 + info.nickname.length)
        let io = 0

        infobuf.writeUInt8(info.nickname.length, io)
        io++

        infobuf.write(info.nickname, io, info.nickname.length)
        io += info.nickname.length

        infobuf.writeUIntBE(info.length, io, 3)
        io += 3

        buf = Buffer.concat([buf, infobuf])
      }

      for (let ws of clients) {
        ws.send(buf)
      }
    })

    client.on('minimap', function (minimap) {
      let clients = [...expressWs.getWss().clients].filter(function (ws) {
        return ws.readyState === WebSocket.OPEN
      })

      if (clients.length === 0) return

      let s = `${ip}:${port}`
      let o = 0

      let buf = Buffer.alloc(2 + s.length)

      buf.writeUInt8(1, o)
      o++

      buf.writeUInt8(s.length, o)
      o++

      buf.write(s, o, s.length)
      o += s.length

      buf = Buffer.concat([buf, Buffer.from(minimap)])

      for (let ws of clients) {
        ws.send(buf)
      }
    })

    // TODO: bot

    client.on('dead', function () {
      spawn(ip, port)
    })

    client.on('new highscore of the day', function () {
      spawn(ip, port)
    })

    client.on('v unknown', function () {
      spawn(ip, port)
    })
  }
})()
