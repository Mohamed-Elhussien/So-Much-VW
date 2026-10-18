function errorHandler(err, req, res, next) {
  console.error(err)

  const status = err.status || 500
  const message = status === 500 ? 'Something went wrong on our end.' : err.message

  res.status(status).json({ error: message })
}

module.exports = errorHandler
