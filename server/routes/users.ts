import express from 'express'
import { prisma } from '../prisma'
import { authMiddleware, AuthRequest } from '../middleware'
import bcrypt from 'bcryptjs'

const router = express.Router()

// Middleware to ensure user is authenticated
router.use(authMiddleware)

// Update user profile
router.put('/profile', async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId
    const { name, email, avatar } = req.body

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' })
    }

    // Check if email is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' })
    }

    const updateData: any = {
      name,
      email,
    }

    // Only update avatar if provided and is a valid data URL or URL
    if (avatar && (avatar.startsWith('data:') || avatar.startsWith('http'))) {
      updateData.avatarUrl = avatar
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    res.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating profile:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// Change password
router.post('/change-password', async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId
    const { currentPassword, newPassword } = req.body

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check both new and old password field names for compatibility
    const passwordHash = user.passwordHash || (user as any).password
    if (!passwordHash) {
      return res.status(401).json({ message: 'Password verification failed' })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, passwordHash)

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    })

    res.json({ message: 'Password changed successfully' })
  } catch (error: any) {
    console.error('Error changing password:', error)
    res.status(500).json({ message: 'Failed to change password' })
  }
})

// Update notification preferences
router.put('/preferences', async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Note: Notification preferences would be stored here
    // For now, we'll just return success as the schema doesn't have these fields yet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    res.status(500).json({ message: 'Failed to update preferences' })
  }
})

// Get current user
router.get('/me', async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error: any) {
    console.error('Error fetching user:', error)
    res.status(500).json({ message: 'Failed to fetch user' })
  }
})

export default router
