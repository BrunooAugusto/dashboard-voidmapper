import { getWeeklyReportData } from '../services/reportService.js'
import prisma from '../lib/prisma.js'
import { ok } from '../utils/response.js'

export async function getWeekly(req, res, next) {
  try {
    const data = await getWeeklyReportData(req.user.id)
    ok(res, data)
  } catch (err) {
    next(err)
  }
}

export async function generate(req, res, next) {
  try {
    const {
      periodStart,
      periodEnd,
      observations,
      conclusion,
      newSurveys     = 0,
      deformations   = 0,
      rehabilitation = 0,
      errors         = 0,
    } = req.body ?? {}

    const weekStart = periodStart ? new Date(periodStart) : new Date()
    const weekEnd   = periodEnd   ? new Date(periodEnd)   : new Date()

    const report = await prisma.report.create({
      data: {
        weekStart,
        weekEnd,
        newSurveys:     Number(newSurveys)     || 0,
        deformations:   Number(deformations)   || 0,
        rehabilitation: Number(rehabilitation) || 0,
        errors:         Number(errors)         || 0,
        observations:   observations           ?? null,
        conclusion:     conclusion             ?? null,
        userId:         req.user.id            ?? null,
      },
    })

    ok(res, { ...report, generatedAt: report.createdAt.toISOString() }, 201)
  } catch (err) {
    next(err)
  }
}
