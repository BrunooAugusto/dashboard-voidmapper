import * as authService from '../services/authService.js'
import { ok, fail } from '../utils/response.js'

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body ?? {}
    if (!currentPassword || !newPassword) return fail(res, 'currentPassword e newPassword são obrigatórios')
    if (newPassword.length < 6) return fail(res, 'Nova senha deve ter ao menos 6 caracteres')
    await authService.changePassword(req.user.id, currentPassword, newPassword)
    ok(res, { message: 'Senha alterada com sucesso' })
  } catch (err) { next(err) }
}

export async function register(req, res, next) {
  try {
    const { email, name, password } = req.body
    if (!email || !name || !password) return fail(res, 'email, name e password são obrigatórios')
    const result = await authService.register({ email, name, password })
    ok(res, result, 201)
  } catch (err) { next(err) }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) return fail(res, 'email e password são obrigatórios')
    const result = await authService.login({ email, password })
    ok(res, result)
  } catch (err) { next(err) }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id)
    ok(res, { user })
  } catch (err) { next(err) }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body)
    ok(res, { user })
  } catch (err) { next(err) }
}
