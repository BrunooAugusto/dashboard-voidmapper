import { Router } from 'express'
import { register, login, me, updateProfile, changePassword } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/register',  register)
router.post('/login',     login)
router.get('/me',         authenticate, me)
router.put('/me',         authenticate, updateProfile)
router.put('/password',   authenticate, changePassword)

export default router
