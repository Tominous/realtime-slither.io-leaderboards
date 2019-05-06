module.exports = {
  hooks: {
    'pre-commit': 'npm run prettier:format && git add .'
  }
}
