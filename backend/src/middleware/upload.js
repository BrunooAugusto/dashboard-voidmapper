import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import crypto from 'crypto'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')
mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg'
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
    cb(null, name)
  },
})

export const upload = multer({
  storage,
  limits:     { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)
    cb(null, ok)
  },
})
