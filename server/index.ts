import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth'
import repositoryRoutes from './routes/repositories'
import aiRoutes from './routes/ai'
import integrationRoutes from './routes/integrations'
import usersRoutes from './routes/users'

const app = express()

const corsOrigins = [
  'https://gitverse-two.vercel.app',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (corsOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ✅ REQUIRED FOR PREFLIGHT
app.options('*', cors())

app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok', message: 'GitVerse API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/repositories', repositoryRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/users', usersRoutes)

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
