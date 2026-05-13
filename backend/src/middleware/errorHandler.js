export default function errorHandler(err, req, res, next) {
  const status  = err.status  || 500
  const message = err.message || 'Erro interno do servidor'

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${status}] ${req.method} ${req.path} — ${message}`)
    if (status === 500) console.error(err.stack)
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && status === 500 && { stack: err.stack }),
  })
}
