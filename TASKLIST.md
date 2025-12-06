# zuga.ee Project Setup Tasklist

## Environment Setup

- [x] **Set up Python backend environment**

  ```bash
  cd apps/api
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  pip install -e ".[dev]"
  ```

- [x] **Verify Python backend tests pass**

  ```bash
  cd apps/api
  pytest
  pytest --cov  # Check coverage
  ```

- [x] **Set up Node.js frontend environment**

  ```bash
  cd apps/web
  npm install
  ```

- [x] **Verify frontend tests pass**

  ```bash
  cd apps/web
  npm test
  npm run test:coverage  # Check coverage
  ```

- [x] **Install and configure pre-commit hooks**

  ```bash
  pip install pre-commit
  pre-commit install
  pre-commit run --all-files  # Test all hooks
  ```

## GitHub Integration

- [x] **Create GitHub repository**

  - Go to <https://github.com/new>
  - Name: `zuga.ee`
  - Keep it public or private as preferred
  - Do NOT initialize with README (we already have one)

- [x] **Connect local repo to GitHub**

  ```bash
  git remote add origin git@github.com:mitselek/zuga.ee.git
  # or use HTTPS: git remote add origin https://github.com/mitselek/zuga.ee.git
  git push -u origin main
  ```

- [x] **Set up GitHub Actions CI/CD** (optional but recommended)
  - Create `.github/workflows/ci.yml`
  - Run tests on every push
  - Enforce coverage thresholds

## Content Recovery

- [ ] **Create Wayback Machine scraper script**

  - Script: `scripts/scrape_wayback.py`
  - Find original zuga.ee snapshots
  - Parse HTML to markdown
  - Preserve structure and content

- [ ] **Test scraper and review recovered content**

  - Run scraper
  - Review output in `packages/content/`
  - Verify markdown formatting
  - Check bilingual content

- [ ] **Organize recovered content**
  - Sort into projects/blog/pages
  - Add proper frontmatter
  - Ensure Obsidian compatibility

## News Aggregation System

- [ ] **Design news sources configuration**

  - Create config file for sources
  - Define RSS feeds, websites, APIs
  - Set up source priorities

- [ ] **Create news aggregator script**

  - Script: `scripts/news_aggregator.py`
  - Implement multi-source fetching
  - Parse and normalize content
  - Generate NewsDigest models

- [ ] **Implement AI digest generation**

  - Integrate LLM API
  - Create prompt templates
  - Generate summaries and relevance scores
  - Save digests to content store

- [ ] **Set up scheduling for news aggregation**
  - Configure APScheduler
  - Set daily/weekly schedules
  - Add error handling and logging

## Authentication System

- [ ] **Design email authentication flow**

  - Magic link generation
  - Code verification
  - JWT token creation
  - Session management

- [ ] **Implement auth endpoints**

  - POST /auth/send-code
  - POST /auth/verify
  - POST /auth/refresh
  - GET /auth/me

- [ ] **Create user management**

  - User CRUD operations
  - Role assignment
  - LLM configuration storage

- [ ] **Add auth middleware**
  - JWT verification
  - Role-based access control
  - Protected route decorator

## AI Agent Integration

- [ ] **Design agent capabilities**

  - Content editing prompts
  - Permission checking
  - File system operations
  - Git integration

- [ ] **Implement LLM client abstraction**

  - Support OpenAI, Anthropic
  - API key management
  - Rate limiting
  - Error handling

- [ ] **Create agent endpoints**

  - POST /agent/chat
  - POST /agent/edit-content
  - POST /agent/create-user
  - GET /agent/capabilities

- [ ] **Add approval workflow**
  - Publish/unpublish content
  - Preview changes
  - Rollback mechanism

## Frontend Development

- [ ] **Create portfolio pages**

  - Project listing page
  - Project detail page
  - Blog listing page
  - Blog post page
  - About page

- [ ] **Implement i18n (Estonian/English)**

  - Language switcher
  - Content loading by language
  - URL structure (/et/, /en/)

- [ ] **Build admin chat interface**

  - Chat UI component
  - Message history
  - Agent response rendering
  - File upload support

- [ ] **Create authentication UI**

  - Login form
  - Email verification
  - User settings page

- [ ] **Add content management UI**
  - Content editor
  - Publish controls
  - Preview mode

## Deployment

- [ ] **Configure Netlify**

  - Connect GitHub repository
  - Set up build commands
  - Configure environment variables
  - Set up preview deployments

- [ ] **Set up environment variables**

  - API keys (LLM providers)
  - JWT secrets
  - Database connections (if needed)

- [ ] **Test production build**

  - Build backend
  - Build frontend
  - Test API endpoints
  - Verify content loading

- [ ] **Set up monitoring**
  - Error tracking (Sentry?)
  - Log aggregation
  - Uptime monitoring

## Documentation

- [ ] **Write API documentation**

  - OpenAPI/Swagger docs
  - Authentication guide
  - Endpoint examples

- [ ] **Create development guide**

  - Setup instructions
  - TDD workflow
  - Contributing guidelines

- [ ] **Document architecture decisions**
  - Why file-based content
  - Why monorepo
  - Security considerations

---

## Current Status: Environment Setup Phase

**Last Updated:** December 6, 2025
