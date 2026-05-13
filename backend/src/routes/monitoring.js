import { Router } from 'express'
import { list, show, create, update, remove } from '../controllers/monitoringController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/',       authenticate, list)
router.get('/:id',    authenticate, show)
router.post('/',      authenticate, create)
router.put('/:id',    authenticate, update)
router.delete('/:id', authenticate, remove)

export default router
