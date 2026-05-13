import { Router } from 'express'
import authRouter       from './auth.js'
import projectsRouter   from './projects.js'
import monitoringRouter from './monitoring.js'
import dashboardRouter  from './dashboard.js'
import reportsRouter    from './reports.js'

const router = Router()

router.use('/auth',       authRouter)
router.use('/projects',   projectsRouter)
router.use('/monitoring', monitoringRouter)
router.use('/dashboard',  dashboardRouter)
router.use('/reports',    reportsRouter)

export default router
