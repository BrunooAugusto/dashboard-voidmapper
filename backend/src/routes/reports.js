import { Router } from 'express'
import { getWeekly, generate } from '../controllers/reportsController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/weekly',    authenticate, getWeekly)
router.post('/generate', authenticate, generate)

export default router
