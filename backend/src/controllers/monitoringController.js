import * as monitoringService from '../services/monitoringService.js'
import { ok } from '../utils/response.js'

export async function list(req, res, next) {
  try {
    const rows = await monitoringService.getAll(req.user.id)
    ok(res, { rows })
  } catch (err) { next(err) }
}

export async function show(req, res, next) {
  try {
    const row = await monitoringService.getById(Number(req.params.id), req.user.id)
    ok(res, { row })
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const row = await monitoringService.create(req.body, req.user.id)
    ok(res, { row }, 201)
  } catch (err) { next(err) }
}

export async function update(req, res, next) {
  try {
    const row = await monitoringService.update(Number(req.params.id), req.body, req.user.id)
    ok(res, { row })
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await monitoringService.remove(Number(req.params.id), req.user.id)
    ok(res, { message: 'Monitoramento removido com sucesso' })
  } catch (err) { next(err) }
}
