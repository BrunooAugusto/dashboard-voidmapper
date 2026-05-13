import { Router } from 'express'
import { list, show, create, update, remove, uploadImage, deleteImage } from '../controllers/projectController.js'
import { list as listSurveys, create as createSurvey } from '../controllers/surveyController.js'
import { authenticate } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.get('/',                       authenticate, list)
router.get('/:id',                    authenticate, show)
router.post('/',                      authenticate, create)
router.put('/:id',                    authenticate, update)
router.delete('/:id',                 authenticate, remove)
router.post('/:id/images',            authenticate, upload.single('image'), uploadImage)
router.delete('/:id/images/:imageId', authenticate, deleteImage)
router.get('/:id/surveys',            authenticate, listSurveys)
router.post('/:id/surveys',           authenticate, createSurvey)

export default router
