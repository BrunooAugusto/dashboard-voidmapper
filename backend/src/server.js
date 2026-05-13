import 'dotenv/config'
import express      from 'express'
import cors         from 'cors'
import path         from 'path'
import { fileURLToPath } from 'url'
import routes       from './routes/index.js'
import errorHandler from './middleware/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Static — uploaded project images ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api', routes)

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' })
})

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Void Mapper API   →  http://localhost:${PORT}/api`)
  console.log(`❤️   Health check     →  http://localhost:${PORT}/api/health`)
  console.log(`📦  Environment       →  ${process.env.NODE_ENV}`)
})

export default app
