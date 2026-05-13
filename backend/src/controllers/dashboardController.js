import * as dashboardService from '../services/dashboardService.js'
import { ok } from '../utils/response.js'

export async function metrics(req, res, next) {
  try {
    const data = await dashboardService.getMetrics(req.user.id)
    ok(res, data)
  } catch (err) { next(err) }
}

export async function recentSurveys(req, res, next) {
  try {
    const surveys = await dashboardService.getRecentSurveys(req.user.id)
    ok(res, { surveys })
  } catch (err) { next(err) }
}

export async function analytics(req, res, next) {
  try {
    const { period = 'weekly', month } = req.query
    const data = await dashboardService.getAnalytics(
      period,
      req.user.id,
      month !== undefined ? parseInt(month) : undefined,
    )
    ok(res, data)
  } catch (err) { next(err) }
}

export async function rehabilitatedProjects(req, res, next) {
  try {
    const projects = await dashboardService.getRehabilitatedProjects(req.user.id)
    ok(res, { projects })
  } catch (err) { next(err) }
}
