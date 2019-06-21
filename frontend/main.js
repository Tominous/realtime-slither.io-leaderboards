;(function() {
  require('./main.css')

  let ripple = require('@material/ripple')
  let messages = require('../messages')

  let cache = {}

  function getCached(server) {
    let cached = cache[server]

    if (typeof cached === 'undefined') {
      let card = document.createElement('div')
      card.className = 'mdc-card mdc-ripple-surface'

      ripple.MDCRipple.attachTo(card)

      let primaryAction = document.createElement('div')
      primaryAction.className = 'mdc-card__primary-action'

      let media = document.createElement('div')
      media.className = 'mdc-card__media'

      let title = document.createElement('div')
      title.className = 'mdc-card__media-content'
      title.innerText = server

      media.appendChild(title)
      media.appendChild(document.createElement('br'))

      let canvas = document.createElement('canvas')
      canvas.width = 104
      canvas.height = 104

      let context = canvas.getContext('2d')
      context.fillStyle = 'rgba(255, 255, 255, 0.25)'
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      context.fillText('Loading', canvas.width / 2, canvas.height / 2)

      media.appendChild(canvas)

      let botPositionAndLength = document.createElement('div')
      botPositionAndLength.innerText = 'Loading'

      let leaderboard = document.createElement('div')
      leaderboard.innerText = 'Loading'

      primaryAction.appendChild(media)
      primaryAction.appendChild(botPositionAndLength)
      primaryAction.appendChild(leaderboard)

      card.appendChild(primaryAction)

      document.body.appendChild(card)
      document.body.appendChild(document.createElement('br'))

      return (cache[server] = {
        canvas,
        context,
        botPositionAndLength,
        leaderboard
      })
    }

    return cached
  }

  let socket = new WebSocket(
    `${location.protocol.replace('http', 'ws')}//${location.host}/`
  )

  socket.binaryType = 'arraybuffer'

  socket.onmessage = function(event) {
    let buffer = Buffer.from(event.data)

    switch (buffer.readUInt8(0)) {
      case messages.leaderboard.type: {
        let decoded = messages.leaderboard.decode(buffer)
        let cached = getCached(decoded.server)

        cached.leaderboard.innerText = `Bot's rank: ${decoded.botRank}
Total players: ${decoded.totalPlayers}
Total score: ${decoded.leaderboard.reduce(function(previousValue, snake) {
          return previousValue + snake.length
        }, 0)}

#1 ${decoded.leaderboard[0].nickname} ${decoded.leaderboard[0].length}
#2 ${decoded.leaderboard[1].nickname} ${decoded.leaderboard[1].length}
#3 ${decoded.leaderboard[2].nickname} ${decoded.leaderboard[2].length}
#4 ${decoded.leaderboard[3].nickname} ${decoded.leaderboard[3].length}
#5 ${decoded.leaderboard[4].nickname} ${decoded.leaderboard[4].length}
#6 ${decoded.leaderboard[5].nickname} ${decoded.leaderboard[5].length}
#7 ${decoded.leaderboard[6].nickname} ${decoded.leaderboard[6].length}
#8 ${decoded.leaderboard[7].nickname} ${decoded.leaderboard[7].length}
#9 ${decoded.leaderboard[8].nickname} ${decoded.leaderboard[8].length}
#10 ${decoded.leaderboard[9].nickname} ${decoded.leaderboard[9].length}`

        break
      }

      case messages.minimap.type: {
        let decoded = messages.minimap.decode(buffer)
        let cached = getCached(decoded.server)

        cached.context.clearRect(
          0,
          0,
          cached.canvas.width,
          cached.canvas.height
        )

        for (let position of decoded.positions) {
          cached.context.fillRect(position[0], position[1], 1, 1)
        }

        break
      }

      case messages.botPositionAndLength.type: {
        let decoded = messages.botPositionAndLength.decode(buffer)
        let cached = getCached(decoded.server)

        cached.botPositionAndLength.innerText = `Bot's position: ${decoded.x}x${decoded.y}
        Bot's length: ${decoded.length}`

        break
      }
    }
  }
})()
