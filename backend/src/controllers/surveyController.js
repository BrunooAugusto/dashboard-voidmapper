import { createForProject, getForProject } from '../services/surveyService.js'
import { ok } from '../utils/response.js'

export async function list(req, res, next) {
  try {
    const surveys = await getForProject(Number(req.params.id))
    ok(res, { surveys })
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const survey = await createForProject(Number(req.params.id), req.body)
    ok(res, { survey }, 201)
  } catch (err) { next(err) }
}
