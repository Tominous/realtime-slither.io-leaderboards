/* eslint-env browser */

;(function() {
  let cache = {}
  let textDecoder = new TextDecoder('utf-8')

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

    let server = textDecoder.decode(
      event.data.slice(offset, offset + serverLength)
    )
    offset += serverLength

    let cached = cache[server]

    if (typeof cached === 'undefined') {
      let container = document.createElement('div')
      container.className = 'box'

      let box = document.createElement('div')
      box.className = 'media'
      box.style.display = 'inline-block'

      let figureContainer = document.createElement('div')
      figureContainer.className = 'media-left'
      figureContainer.style.display = 'inline-block'
      figureContainer.style.verticalAlign = 'top'

      let figure = document.createElement('figure')
      figure.className = 'image is-128x128'

      let canvas = document.createElement('canvas')
      canvas.width = 104
      canvas.height = 104
      canvas.style.width = '104px'
      canvas.style.height = '104px'

      let context = canvas.getContext('2d')
      context.fillStyle = 'rgba(255, 255, 255, 0.40)'
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      context.fillText('Loading', canvas.width / 2, canvas.height / 2)

      figure.appendChild(canvas)
      figureContainer.appendChild(figure)
      box.appendChild(figureContainer)

      let contentContainer = document.createElement('div')
      contentContainer.className = 'media-content'
      contentContainer.style.display = 'inline-block'

      let serverContent = document.createElement('div')
      serverContent.className = 'content'
      serverContent.innerText = server

      let botPositionAndLength = document.createElement('div')
      botPositionAndLength.className = 'content'
      botPositionAndLength.innerText = 'Loading'

      let leaderboard = document.createElement('div')
      leaderboard.className = 'content'
      leaderboard.innerText = 'Loading'

      contentContainer.appendChild(serverContent)
      contentContainer.appendChild(botPositionAndLength)
      contentContainer.appendChild(leaderboard)
      box.appendChild(contentContainer)

      container.appendChild(box)
      document.body.appendChild(container)

      cached = cache[server] = {
        canvas,
        context,
        botPositionAndLength,
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

          let nickname = textDecoder.decode(
            event.data.slice(offset, offset + nicknameLength)
          )
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

        let length = view.getUint16(offset)
        offset += 2

        cached.botPositionAndLength.innerText = `Bot's position: ${x}x${y}
        Bot's length: ${length}`

        break
      }
    }
  }
})()
