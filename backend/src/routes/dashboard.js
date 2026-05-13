import { Router } from 'express'
import { metrics, recentSurveys, analytics, rehabilitatedProjects } from '../controllers/dashboardController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/metrics',                authenticate, metrics)
router.get('/recent-surveys',         authenticate, recentSurveys)
router.get('/analytics',              authenticate, analytics)
router.get('/rehabilitated-projects', authenticate, rehabilitatedProjects)

export default router
