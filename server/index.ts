import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import repositoryRoutes from './routes/repositories'
import aiRoutes from './routes/ai'
import integrationRoutes from './routes/integrations'
import usersRoutes from './routes/users'

// Load environment variables
dotenv.config()

const app = express()

// CORS configuration
const corsOrigins = [
  'https://gitverse-two.vercel.app',
]

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
)

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GitVerse API is running' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/repositories', repositoryRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/users', usersRoutes)

// Error handling middleware
app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
)

// 👇 THIS IS THE KEY DIFFERENCE
export default app
