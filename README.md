# Realtime slither.io leaderboards

[![build](https://travis-ci.org/vvanelslande/realtime-slither.io-leaderboards.svg?branch=master)](https://travis-ci.org/vvanelslande/realtime-slither.io-leaderboards)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io)

Realtime slither.io leaderboards

## API

### WebSocket

#### /

##### Clientbound

All start with:

| Type          | Description   |
| ------------- | ------------- |
| Unsigned byte | Type          |
| Unsigned byte | Server length |
| String        | Server        |

###### Type 0: leaderboard

| Type                    | Description   |
| ----------------------- | ------------- |
| Unsigned 16-bit integer | Bot's rank    |
| Unsigned 16-bit integer | Total players |
| Array of 10 snakes      | Snakes        |

Snake:

| Type                    | Description     |
| ----------------------- | --------------- |
| Unsigned byte           | Nickname length |
| String                  | Nickname        |
| Unsigned 24-bit integer | Length          |

###### Type 1: minimap

| Type           | Description |
| -------------- | ----------- |
| 80 \* 80 array | Minimap     |

###### Type 2: bot moved

| Type                    | Description |
| ----------------------- | ----------- |
| Unsigned 16-bit integer | X           |
| Unsigned 16-bit integer | Y           |
| Unsigned 24-bit integer | Length      |
