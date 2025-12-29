# GitVerse Backend API

Express.js server for GitVerse with Prisma ORM and PostgreSQL.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `GEMINI_API_KEY`: Google Gemini API key
- `JWT_SECRET`: JWT token signing secret

## Routes

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/health` - Health check
- `GET /api/repositories/:owner/:repo` - Get repository details
- `POST /api/ai/analyze` - AI repository analysis
- `GET /api/users/me` - Get current user
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password

## Deployment

Deploy to Vercel with `vercel deploy` or `vercel --prod`
