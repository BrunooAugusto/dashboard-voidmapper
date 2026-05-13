import { verifyToken } from '../utils/jwt.js'
import { createError } from '../utils/response.js'

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(createError(401, 'Token de autenticação não fornecido'))
  }
  const token = header.split(' ')[1]
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    next(createError(401, 'Token inválido ou expirado'))
  }
}
