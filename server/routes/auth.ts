import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../prisma'
import { generateToken } from '../auth'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

// Signup endpoint
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
      },
    })

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email })

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      token,
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password
    const passwordHash = user.passwordHash || (user as any).password
    if (!passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user (verify session)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout endpoint (client-side token removal, but we can track sessions if needed)
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  // In a stateless JWT setup, logout is handled client-side by removing the token
  // We can optionally implement token blacklisting here if needed
  res.json({ message: 'Logged out successfully' })
})

export default router
