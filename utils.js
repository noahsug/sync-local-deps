const fs = require('fs')

function isDirectory(file) {
  let stats
  try {
    stats = fs.statSync(file)
  } catch (e) {
    return false
  }
  return stats && stats.isDirectory()
}

module.exports = { isDirectory }
