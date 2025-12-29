import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware'
import { GitHubService } from '../services/githubService'
import { GitLabService } from '../services/gitlabService'
import { BitbucketService } from '../services/bitbucketService'
import { repositoryService } from '../services/repositoryService'

const router = Router()

/**
 * POST /api/integrations/github/repositories
 * List GitHub repositories
 */
router.post('/github/repositories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { token, username } = req.body

    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' })
    }

    const github = new GitHubService(token)
    const repositories = await github.listUserRepositories(username)

    res.json({ repositories })
  } catch (error: any) {
    console.error('GitHub repositories error:', error)
    res.status(500).json({ error: 'Failed to fetch GitHub repositories', details: error.message })
  }
})

/**
 * POST /api/integrations/github/import
 * Import repository from GitHub
 */
router.post('/github/import', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { url, token } = req.body

    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' })
    }

    const parsed = GitHubService.parseGitHubUrl(url)
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid GitHub URL' })
    }

    const github = new GitHubService(token)
    const repoData = await github.getRepository(parsed.owner, parsed.repo)

    // Create repository in our system
    const repository = await repositoryService.createRepository({
      name: repoData.name,
      url: repoData.clone_url,
      description: repoData.description || undefined,
      userId: req.user!.userId,
    })

    res.status(201).json({ repository, source: 'github' })
  } catch (error: any) {
    console.error('GitHub import error:', error)
    res.status(500).json({ error: 'Failed to import from GitHub', details: error.message })
  }
})

/**
 * POST /api/integrations/gitlab/repositories
 * List GitLab projects
 */
router.post('/gitlab/repositories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { token, baseURL } = req.body

    if (!token) {
      return res.status(400).json({ error: 'GitLab token is required' })
    }

    const gitlab = new GitLabService(token, baseURL)
    const projects = await gitlab.listUserProjects()

    res.json({ repositories: projects })
  } catch (error: any) {
    console.error('GitLab repositories error:', error)
    res.status(500).json({ error: 'Failed to fetch GitLab projects', details: error.message })
  }
})

/**
 * POST /api/integrations/gitlab/import
 * Import project from GitLab
 */
router.post('/gitlab/import', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { url, token, baseURL } = req.body

    if (!url) {
      return res.status(400).json({ error: 'Project URL is required' })
    }

    const parsed = GitLabService.parseGitLabUrl(url)
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid GitLab URL' })
    }

    const gitlab = new GitLabService(token, baseURL)
    const projectData = await gitlab.getProject(parsed.projectPath)

    // Create repository in our system
    const repository = await repositoryService.createRepository({
      name: projectData.name,
      url: projectData.http_url_to_repo,
      description: projectData.description || undefined,
      userId: req.user!.userId,
    })

    res.status(201).json({ repository, source: 'gitlab' })
  } catch (error: any) {
    console.error('GitLab import error:', error)
    res.status(500).json({ error: 'Failed to import from GitLab', details: error.message })
  }
})

/**
 * POST /api/integrations/bitbucket/repositories
 * List Bitbucket repositories
 */
router.post('/bitbucket/repositories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Bitbucket token is required' })
    }

    const bitbucket = new BitbucketService(token)
    const data = await bitbucket.listUserRepositories()

    res.json({ repositories: data.values })
  } catch (error: any) {
    console.error('Bitbucket repositories error:', error)
    res
      .status(500)
      .json({ error: 'Failed to fetch Bitbucket repositories', details: error.message })
  }
})

/**
 * POST /api/integrations/bitbucket/import
 * Import repository from Bitbucket
 */
router.post('/bitbucket/import', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { url, token } = req.body

    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' })
    }

    const parsed = BitbucketService.parseBitbucketUrl(url)
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid Bitbucket URL' })
    }

    const bitbucket = new BitbucketService(token)
    const repoData = await bitbucket.getRepository(parsed.workspace, parsed.repoSlug)

    // Find clone URL
    const cloneUrl =
      repoData.links.clone.find((l) => l.name === 'https')?.href || repoData.links.clone[0].href

    // Create repository in our system
    const repository = await repositoryService.createRepository({
      name: repoData.name,
      url: cloneUrl,
      description: repoData.description || undefined,
      userId: req.user!.userId,
    })

    res.status(201).json({ repository, source: 'bitbucket' })
  } catch (error: any) {
    console.error('Bitbucket import error:', error)
    res.status(500).json({ error: 'Failed to import from Bitbucket', details: error.message })
  }
})

/**
 * POST /api/integrations/validate-token
 * Validate integration token
 */
router.post('/validate-token', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { provider, token, baseURL } = req.body

    if (!provider || !token) {
      return res.status(400).json({ error: 'Provider and token are required' })
    }

    let valid = false

    switch (provider) {
      case 'github':
        const github = new GitHubService(token)
        valid = await github.validateToken()
        break
      case 'gitlab':
        const gitlab = new GitLabService(token, baseURL)
        valid = await gitlab.validateToken()
        break
      case 'bitbucket':
        const bitbucket = new BitbucketService(token)
        valid = await bitbucket.validateToken()
        break
      default:
        return res.status(400).json({ error: 'Invalid provider' })
    }

    res.json({ valid, provider })
  } catch (error: any) {
    console.error('Token validation error:', error)
    res.status(500).json({ error: 'Failed to validate token', details: error.message })
  }
})

export default router
