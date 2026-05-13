export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data })
}

export function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message })
}

export function createError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}
