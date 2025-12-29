import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware'
import { repositoryService } from '../services/repositoryService'

const router = Router()

/**
 * POST /api/repositories
 * Create a new repository and start analysis
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, url, description } = req.body

    console.log('Create repository request:', { name, url, userId: req.user?.userId })

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' })
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/.+/
    if (!urlPattern.test(url)) {
      return res.status(400).json({ error: 'Invalid repository URL' })
    }

    const repository = await repositoryService.createRepository({
      name,
      url,
      description,
      userId: req.user!.userId,
    })

    console.log('Repository created:', repository.id)

    res.status(201).json({ repository })
  } catch (error: any) {
    console.error('Create repository error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ error: 'Failed to create repository', details: error.message })
  }
})

/**
 * GET /api/repositories
 * List all repositories for the authenticated user
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const repositories = await repositoryService.listRepositories(req.user!.userId)

    res.json({ repositories })
  } catch (error: any) {
    console.error('List repositories error:', error)
    res.status(500).json({ error: 'Failed to list repositories' })
  }
})

/**
 * GET /api/repositories/:id
 * Get detailed repository data
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid repository ID' })
    }

    const repository = await repositoryService.getRepository(id, req.user!.userId)

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' })
    }

    res.json({ repository })
  } catch (error: any) {
    console.error('Get repository error:', error)
    res.status(500).json({ error: 'Failed to get repository' })
  }
})

/**
 * GET /api/repositories/:id/stats
 * Get repository statistics
 */
router.get('/:id/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid repository ID' })
    }

    const stats = await repositoryService.getRepositoryStats(id, req.user!.userId)

    res.json({ stats })
  } catch (error: any) {
    console.error('Get repository stats error:', error)
    res.status(500).json({ error: 'Failed to get repository statistics' })
  }
})

/**
 * POST /api/repositories/:id/analyze
 * Trigger re-analysis of a repository
 */
router.post('/:id/analyze', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid repository ID' })
    }

    // Verify ownership
    const repository = await repositoryService.getRepository(id, req.user!.userId)

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' })
    }

    // Start analysis in background
    repositoryService.analyzeRepository(id).catch(console.error)

    res.json({ message: 'Analysis started', status: 'analyzing' })
  } catch (error: any) {
    console.error('Analyze repository error:', error)
    res.status(500).json({ error: 'Failed to start analysis' })
  }
})

/**
 * DELETE /api/repositories/:id
 * Delete a repository
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid repository ID' })
    }

    await repositoryService.deleteRepository(id, req.user!.userId)

    res.json({ message: 'Repository deleted successfully' })
  } catch (error: any) {
    console.error('Delete repository error:', error)

    if (error.message === 'Repository not found') {
      return res.status(404).json({ error: error.message })
    }

    res.status(500).json({ error: 'Failed to delete repository' })
  }
})

export default router
