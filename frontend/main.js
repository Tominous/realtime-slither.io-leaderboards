;(function() {
  let cache = {}

  let socket = new WebSocket(
    `${location.protocol.replace('http', 'ws')}//${location.host}/`
  )

  socket.binaryType = 'arraybuffer'

  socket.onmessage = function(event) {
    let view = new DataView(event.data)
    let offset = 0

    let type = view.getUint8(offset)
    offset++

    let serverLength = view.getUint8(offset)
    offset++

    let server = Array.from(new Uint8Array(event.data.slice(offset, offset + serverLength))).map(function(code) {
      return String.fromCharCode(code)
    }).join('')

    offset += serverLength

    let cached = cache[server]

    if (typeof cached === 'undefined') {
      let card = document.createElement('div')
      card.className = 'mdc-card mdc-ripple-surface'

      mdc.ripple.MDCRipple.attachTo(card)

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
      context.fillStyle = 'rgba(255, 255, 255, 0.40)'
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      context.fillText('Loading', canvas.width / 2, canvas.height / 2)

      media.appendChild(canvas)

      let botPositionAndScore = document.createElement('div')
      botPositionAndScore.innerText = 'Loading'

      let leaderboard = document.createElement('div')
      leaderboard.innerText = 'Loading'

      primaryAction.appendChild(media)
      primaryAction.appendChild(botPositionAndScore)
      primaryAction.appendChild(leaderboard)

      card.appendChild(primaryAction)

      document.body.appendChild(card)
      document.body.appendChild(document.createElement('br'))

      cached = cache[server] = {
        canvas,
        context,
        botPositionAndScore,
        leaderboard
      }
    }

    switch (type) {
      case 0: {
        let leaderboard = []

        let botRank = view.getUint16(offset)
        offset += 2

        let totalPlayers = view.getUint16(offset)
        offset += 2

        let totalScore = 0

        while (offset < event.data.byteLength) {
          let nicknameLength = view.getUint8(offset)
          offset++

          let nickname = Array.from(new Uint8Array(event.data.slice(offset, offset + nicknameLength))).map(function(code) {
      return String.fromCharCode(code)
    }).join('')

          offset += nicknameLength

          let length = (view.getUint16(offset) << 8) + view.getUint8(offset + 2)
          offset += 3

          totalScore += length

          leaderboard.push({
            nickname,
            length
          })
        }

        cached.leaderboard.innerText = `Bot's rank: ${botRank}
      Total players: ${totalPlayers}
      Total score: ${totalScore}

      #1 ${leaderboard[0].nickname} ${leaderboard[0].length}
      #2 ${leaderboard[1].nickname} ${leaderboard[1].length}
      #3 ${leaderboard[2].nickname} ${leaderboard[2].length}
      #4 ${leaderboard[3].nickname} ${leaderboard[3].length}
      #5 ${leaderboard[4].nickname} ${leaderboard[4].length}
      #6 ${leaderboard[5].nickname} ${leaderboard[5].length}
      #7 ${leaderboard[6].nickname} ${leaderboard[6].length}
      #8 ${leaderboard[7].nickname} ${leaderboard[7].length}
      #9 ${leaderboard[8].nickname} ${leaderboard[8].length}
      #10 ${leaderboard[9].nickname} ${leaderboard[9].length}`

        break
      }

      case 1: {
        cached.context.clearRect(
          0,
          0,
          cached.canvas.width,
          cached.canvas.height
        )

        let i = 0

        while (offset < event.data.byteLength) {
          if (view.getUint8(offset) === 1) {
            cached.context.fillRect(
              (i % 80) + 80 - 80 + 12,
              i / 80 + 80 - 80 + 12,
              1,
              1
            )
          }

          i++
          offset++
        }

        break
      }

      case 2: {
        let x = view.getUint16(offset)
        offset += 2

        let y = view.getUint16(offset)
        offset += 2

        let score = view.getUint16(offset)
        offset += 2

        cached.botPositionAndScore.innerText = `Bot's position: ${x}x${y}
        Bot's score: ${score}`

        break
      }
    }
  }
})()
