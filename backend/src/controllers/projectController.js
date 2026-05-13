import * as projectService from '../services/projectService.js'
import { updateMonitoringFromProject } from '../services/monitoringService.js'
import { ok } from '../utils/response.js'

export async function list(req, res, next) {
  try {
    const projects = await projectService.getAll(req.query)
    ok(res, { projects })
  } catch (err) { next(err) }
}

export async function show(req, res, next) {
  try {
    const project = await projectService.getById(Number(req.params.id))
    ok(res, { project })
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const project = await projectService.create(req.body, req.user.id)
    ok(res, { project }, 201)
    updateMonitoringFromProject(project).catch(console.error)
  } catch (err) { next(err) }
}

export async function update(req, res, next) {
  try {
    const project = await projectService.update(Number(req.params.id), req.body)
    ok(res, { project })
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await projectService.remove(Number(req.params.id))
    ok(res, { message: 'Projeto removido com sucesso' })
  } catch (err) { next(err) }
}

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) throw Object.assign(new Error('Nenhum arquivo enviado'), { status: 400 })
    const projectId = Number(req.params.id)
    const baseUrl   = `${req.protocol}://${req.get('host')}`
    const url       = `${baseUrl}/uploads/${req.file.filename}`
    const image     = await projectService.addImage(projectId, { url })
    ok(res, { image }, 201)
  } catch (err) { next(err) }
}

export async function deleteImage(req, res, next) {
  try {
    await projectService.removeImage(Number(req.params.imageId))
    ok(res, { message: 'Imagem removida com sucesso' })
  } catch (err) { next(err) }
}
