import axios, { AxiosInstance } from 'axios'

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  default_branch: string
  private: boolean
  size: number
  stargazers_count: number
  forks_count: number
  language: string | null
  created_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

export interface GitHubUser {
  login: string
  id: number
  name: string
  email: string | null
  avatar_url: string
  public_repos: number
}

export interface GitHubCommit {
  sha: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    message: string
  }
  stats?: {
    total: number
    additions: number
    deletions: number
  }
}

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

export class GitHubService {
  private client: AxiosInstance
  private token?: string

  constructor(token?: string) {
    this.token = token
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
  }

  /**
   * Get authenticated user information
   */
  async getAuthenticatedUser(): Promise<GitHubUser> {
    if (!this.token) {
      throw new Error('GitHub token required for authentication')
    }

    const response = await this.client.get('/user')
    return response.data
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await this.client.get(`/repos/${owner}/${repo}`)
    return response.data
  }

  /**
   * List user repositories
   */
  async listUserRepositories(
    username?: string,
    params?: {
      type?: 'all' | 'owner' | 'member'
      sort?: 'created' | 'updated' | 'pushed' | 'full_name'
      direction?: 'asc' | 'desc'
      per_page?: number
      page?: number
    }
  ): Promise<GitHubRepository[]> {
    const endpoint = username ? `/users/${username}/repos` : '/user/repos'

    const response = await this.client.get(endpoint, {
      params: {
        type: params?.type || 'owner',
        sort: params?.sort || 'updated',
        direction: params?.direction || 'desc',
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      },
    })

    return response.data
  }

  /**
   * Get repository branches
   */
  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    const response = await this.client.get(`/repos/${owner}/${repo}/branches`)
    return response.data
  }

  /**
   * Get repository commits
   */
  async getCommits(
    owner: string,
    repo: string,
    params?: {
      sha?: string
      path?: string
      per_page?: number
      page?: number
    }
  ): Promise<GitHubCommit[]> {
    const response = await this.client.get(`/repos/${owner}/${repo}/commits`, {
      params: {
        sha: params?.sha,
        path: params?.path,
        per_page: params?.per_page || 100,
        page: params?.page || 1,
      },
    })

    return response.data
  }

  /**
   * Get commit details with stats
   */
  async getCommit(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
    const response = await this.client.get(`/repos/${owner}/${repo}/commits/${sha}`)
    return response.data
  }

  /**
   * Get repository languages
   */
  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    const response = await this.client.get(`/repos/${owner}/${repo}/languages`)
    return response.data
  }

  /**
   * Get repository contributors
   */
  async getContributors(
    owner: string,
    repo: string
  ): Promise<
    Array<{
      login: string
      contributions: number
      avatar_url: string
    }>
  > {
    const response = await this.client.get(`/repos/${owner}/${repo}/contributors`)
    return response.data
  }

  /**
   * Search repositories
   */
  async searchRepositories(
    query: string,
    params?: {
      sort?: 'stars' | 'forks' | 'updated'
      order?: 'asc' | 'desc'
      per_page?: number
      page?: number
    }
  ): Promise<{ items: GitHubRepository[]; total_count: number }> {
    const response = await this.client.get('/search/repositories', {
      params: {
        q: query,
        sort: params?.sort,
        order: params?.order || 'desc',
        per_page: params?.per_page || 30,
        page: params?.page || 1,
      },
    })

    return response.data
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  static parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/,
      /github\.com\/([^\/]+)\/([^\/]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
        }
      }
    }

    return null
  }

  /**
   * Validate GitHub token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getAuthenticatedUser()
      return true
    } catch {
      return false
    }
  }
}

export const githubService = new GitHubService()
