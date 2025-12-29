import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware'
import { geminiService } from '../services/geminiService'
import { repositoryService } from '../services/repositoryService'

const router = Router()

/**
 * POST /api/ai/analyze-repository
 * Analyze repository and provide AI-powered insights
 */
router.post('/analyze-repository', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { repositoryId, type } = req.body

    if (!repositoryId || !type) {
      return res.status(400).json({ error: 'Repository ID and analysis type are required' })
    }

    // Verify repository ownership
    const repository = await repositoryService.getRepository(repositoryId, req.user!.userId)

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' })
    }

    // Build context from repository data
    const context = {
      languages: repository.languages.map((l) => ({
        name: l.name,
        percentage: l.percentage,
      })),
      contributors: repository.contributors.map((c) => ({
        name: c.name,
        commits: c.commits,
      })),
      commits: repository.commits.slice(0, 10).map((c) => ({
        message: c.message,
        author: c.authorName,
        date: c.committedAt.toISOString(),
      })),
    }

    const analysis = await geminiService.analyzeRepository({
      repositoryId,
      type,
      context,
    })

    res.json({ analysis, type })
  } catch (error: any) {
    console.error('Repository analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze repository', details: error.message })
  }
})

/**
 * POST /api/ai/analyze-code
 * Analyze code snippet and provide insights
 */
router.post('/analyze-code', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { code, language, analysisType, context } = req.body

    if (!code || !language || !analysisType) {
      return res.status(400).json({ error: 'Code, language, and analysis type are required' })
    }

    if (code.length > 10000) {
      return res.status(400).json({ error: 'Code snippet too large (max 10000 characters)' })
    }

    const analysis = await geminiService.analyzeCode({
      code,
      language,
      analysisType,
      context,
    })

    res.json({ analysis, analysisType })
  } catch (error: any) {
    console.error('Code analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze code', details: error.message })
  }
})

/**
 * POST /api/ai/chat
 * Chat with AI about repository
 */
router.post('/chat', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { repositoryId, question, conversationHistory } = req.body

    if (!repositoryId || !question) {
      return res.status(400).json({ error: 'Repository ID and question are required' })
    }

    // Verify repository ownership
    const repository = await repositoryService.getRepository(repositoryId, req.user!.userId)

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' })
    }

    // Build context
    const context = {
      files: repository.files.slice(0, 20).map((f) => f.path),
      recentCommits: repository.commits.slice(0, 5).map((c) => `${c.shortHash}: ${c.message}`),
      contributors: repository.contributors.map((c) => c.name),
    }

    const response = await geminiService.chatAboutRepository({
      repositoryId,
      question,
      conversationHistory,
      context,
    })

    res.json({ response, question })
  } catch (error: any) {
    console.error('AI chat error:', error)
    res.status(500).json({ error: 'Failed to process chat', details: error.message })
  }
})

/**
 * POST /api/ai/suggest-commit
 * Generate commit message suggestions
 */
router.post('/suggest-commit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { added, modified, deleted, diff } = req.body

    const suggestions = await geminiService.suggestCommitMessage({
      added: added || [],
      modified: modified || [],
      deleted: deleted || [],
      diff,
    })

    res.json({ suggestions })
  } catch (error: any) {
    console.error('Commit suggestion error:', error)
    res.status(500).json({ error: 'Failed to generate suggestions', details: error.message })
  }
})

/**
 * POST /api/ai/explain-file
 * Explain a file from the repository
 */
router.post('/explain-file', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { repositoryId, filePath } = req.body

    if (!repositoryId || !filePath) {
      return res.status(400).json({ error: 'Repository ID and file path are required' })
    }

    // Verify repository ownership
    const repository = await repositoryService.getRepository(repositoryId, req.user!.userId)

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' })
    }

    // Find file in repository
    const file = repository.files.find((f) => f.path === filePath)

    if (!file) {
      return res.status(404).json({ error: 'File not found in repository' })
    }

    // Note: In a real implementation, you would read the actual file content
    // For now, we'll provide basic file information
    const explanation = `File: ${file.path}\nSize: ${file.size} bytes\nLanguage: ${file.language || 'Unknown'}\n\nThis is a ${file.extension || 'file'} in the repository.`

    res.json({ explanation, file: { path: file.path, language: file.language } })
  } catch (error: any) {
    console.error('File explanation error:', error)
    res.status(500).json({ error: 'Failed to explain file', details: error.message })
  }
})

export default router
