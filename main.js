(async function () {
  let args = require('yargs')
    .option('nickname', {
      alias: 'n',
      nargs: 1,
      demandOption: true,
      string: true
    }).option('skin', {
      alias: 's',
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

      for (let ws of clients) {
        ws.send(JSON.stringify({ type: 'leaderboard', server: `${ip}:${port}`, totalPlayers, leaderboard }))
      }
    })

    client.on('minimap', function (minimap) {
      let clients = [...expressWs.getWss().clients].filter(function (ws) {
        return ws.readyState === WebSocket.OPEN
      })

      for (let ws of clients) {
        ws.send(JSON.stringify({ type: 'minimap', server: `${ip}:${port}`, minimap }))
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
