# zuga.ee Project Constitution

**Version**: 0.1.0

**Last Updated**: December 7, 2025

**Status**: Draft

## Purpose and Authority

This document establishes the core principles and standards that govern all development on the zuga.ee project. When making any technical, architectural, or process decisions, these constitutional principles take precedence over personal preferences or ad-hoc judgments.

**For AI Assistants**: When reviewing code, generating implementations, or providing recommendations, you MUST validate all suggestions against this constitution. Cite specific sections (e.g., "Per Constitution §1: Type Safety First") when explaining why a particular approach is required or forbidden.

**For Developers**: All pull requests will be reviewed for constitutional compliance. If you need to deviate from these principles, document the exception with a `TODO` comment referencing a GitHub issue, and obtain explicit approval in PR review.

---

## Core Development Principles

These five principles form the foundation of all technical decisions on zuga.ee. They are listed in priority order - when principles conflict, higher-numbered principles take precedence.

### §1: Type Safety First

**Principle**: All code must be strictly typed. Type safety prevents runtime bugs and serves as executable documentation.

**Mandatory Requirements**:

- **Python**: `mypy --strict` must pass with zero errors on all committed code
- **TypeScript**: `strict: true` in tsconfig.json required, `any` types forbidden except with explicit justification
- **Pydantic v2 models**: Required for all API request/response boundaries, configuration files, and external data
- **Exception handling**: The `any` type is allowed ONLY when accompanied by a `# type: ignore[<specific-error>]` comment explaining the technical reason and linking to a GitHub issue for resolution

**Rationale**: zuga.ee is designed as a long-term project with AI-generated content and scheduled automation. Strict typing ensures maintainability as complexity grows and prevents silent failures in automated workflows.

**Validation Method**: CI pipeline runs `mypy --strict` and `tsc --noEmit`. Both must exit with status code 0.

**Example - Correct vs Incorrect**:

```python
# ❌ VIOLATION - Untyped function allows runtime errors
def process_content(data):
    return data["title"]  # KeyError if "title" missing

# ✅ COMPLIANT - Strictly typed with Pydantic model
from pydantic import BaseModel

class ContentDocument(BaseModel):
    title: str
    body: str
    published: bool

def process_content(data: ContentDocument) -> str:
    return data.title  # Type-safe, auto-validated
```

**Common Mistakes to Avoid**:

- Using `Dict[str, Any]` instead of Pydantic models for structured data
- Returning `Optional[T]` without documenting when `None` is returned
- Casting with `cast()` to bypass type errors instead of fixing root cause

### §2: Test-First Development

**Principle**: Write the test before writing the implementation. Tests are executable specifications that document expected behavior.

**Mandatory Requirements**:

- **Minimum coverage**: 90% code coverage enforced by pytest-cov (Python) and vitest (TypeScript)
- **TDD workflow**: For all new features/fixes, write failing test → implement feature → verify test passes
- **Property-based testing**: Use Hypothesis (Python) for functions with complex input spaces or edge cases
- **Mutation testing**: Periodically run mutmut to verify test suite quality (tests must catch intentional bugs)

**Rationale**: Test-Driven Development catches bugs during design phase (when they're cheapest to fix), forces decomposable architecture, and creates living documentation that stays synchronized with implementation.

**Validation Method**: CI pipeline runs `pytest --cov=api --cov-fail-under=90` and `vitest --coverage --coverage.threshold=90`. Coverage below threshold fails the build.

**Example - TDD Workflow**:

```bash
# Step 1: Write failing test first (Red phase)
$ pytest tests/test_news_aggregator.py::test_fetch_rss_feed
# FAILED - Function not implemented yet

# Step 2: Implement minimal code to pass test (Green phase)
$ vim scripts/news_aggregator.py
# Implement fetch_rss_feed()

# Step 3: Verify test passes (Green phase)
$ pytest tests/test_news_aggregator.py::test_fetch_rss_feed
# PASSED

# Step 4: Refactor with confidence (Refactor phase)
# Tests protect against regression
```

**What Requires Tests**:

- ✅ All business logic functions
- ✅ All API endpoints (request/response validation)
- ✅ All data transformations (parsers, serializers)
- ✅ All error handling paths (exception cases)
- ❌ Simple getters/setters with no logic
- ❌ Third-party library wrappers (unless adding logic)

**Common Mistakes to Avoid**:

- Writing implementation first, then retrofitting tests (tests won't catch design flaws)
- Testing implementation details instead of behavior (brittle tests that break on refactoring)
- Skipping edge cases (empty inputs, boundary values, error conditions)

### §3: Composable-First Architecture

**Principle**: Build small, single-purpose, testable components. Avoid monolithic functions and classes.

**Mandatory Requirements**:

- **Functions**: Each function should do one thing well (Unix philosophy - compose small tools)
- **Pure functions preferred**: Favor pure functions (no side effects) over stateful classes when possible
- **Dependency injection**: Use constructor injection for testability (don't instantiate dependencies internally)
- **Component size limits**:
  - Python functions: Target < 50 lines, max 100 lines
  - React/Next.js components: Target < 150 lines, extract custom hooks for complex logic
  - Classes: Limit to < 200 lines; if larger, decompose into smaller classes

**Rationale**: Small components are easier to test in isolation, debug when they fail, and reuse across features. Composition enables flexibility without duplication.

**Validation Method**: Manual code review checks component sizes. Reviewers flag functions/components exceeding limits.

**Example - Composable Design**:

```typescript
// ❌ VIOLATION - Monolithic component (data fetching + rendering + business logic)
function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 50 lines of fetch logic
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        // 20 lines of filtering/sorting logic
        const filtered = data.filter(/* complex criteria */);
        setNews(filtered);
        setLoading(false);
      });
  }, []);

  // 100+ lines of rendering logic with inline handlers
  return <div>{/* complex JSX */}</div>;
}

// ✅ COMPLIANT - Composable architecture
// Custom hook handles data fetching (single responsibility)
function useNewsDigest() {
  const [state, setState] = useState({ news: [], loading: true, error: null });

  useEffect(() => {
    fetchNews()
      .then(news => setState({ news, loading: false, error: null }))
      .catch(error => setState({ news: [], loading: false, error }));
  }, []);

  return state;
}

// Presentational component focuses on rendering (single responsibility)
function NewsPage() {
  const { news, loading, error } = useNewsDigest();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary error={error} />;
  return <NewsList items={news} />;
}
```

**Design Questions to Ask**:

Before writing a function/component, ask:

1. **Single Responsibility**: Does this do exactly one thing? Can I name it with a specific verb?
2. **Testability**: Can I test this without mocking the entire world?
3. **Reusability**: Could another feature use this? If yes, is it generic enough?
4. **Pure Function**: Does this function have side effects? Can I eliminate them?

**Common Mistakes to Avoid**:

- Combining UI rendering with business logic in the same component
- Creating "God classes" that know about too many concerns
- Hard-coding dependencies instead of injecting them

### §4: Observable Development

**Principle**: Code should explain what it's doing at runtime. Debugging should not require attaching a debugger.

**Mandatory Requirements**:

- **Structured logging**: Log at key decision points (function entry, branch conditions, external calls) using Python's `logging` module or structured loggers
- **Contextual error messages**: Error messages must include: what failed, why it failed, what input caused failure, and how to fix it
- **API error structure**: FastAPI endpoints return structured errors with `error_code`, `message`, `details`, and `timestamp` fields
- **Frontend error handling**: Use React Error Boundaries; never silently catch and ignore errors
- **Log levels**: DEBUG (dev only), INFO (important state changes), WARNING (recoverable issues), ERROR (failures requiring attention)

**Rationale**: zuga.ee includes AI agents and scheduled background jobs. Observable systems enable debugging production issues without local reproduction. Structured logs can be parsed, searched, and alerted on.

**Validation Method**: Code review verifies that all external calls (HTTP, DB, file I/O) have logging. Error paths must log before raising/returning.

**Example - Observable Error Handling**:

```python
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class ScrapingError(Exception):
    """Raised when web scraping fails with recoverable error."""
    def __init__(self, message: str, error_code: str, url: str):
        super().__init__(message)
        self.error_code = error_code
        self.url = url

# ❌ VIOLATION - Silent failure, no observability
def scrape_wayback(url: str) -> Optional[str]:
    try:
        return requests.get(url).text
    except:
        return None  # What failed? Why? No way to debug!

# ✅ COMPLIANT - Observable at every step
def scrape_wayback(url: str) -> str:
    """Scrape content from Wayback Machine with full observability.

    Args:
        url: Wayback Machine URL to scrape

    Returns:
        HTML content as string

    Raises:
        ScrapingError: If request fails (timeout, HTTP error, network issue)
    """
    logger.info("Starting Wayback scrape", extra={"url": url})

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        content_length = len(response.text)
        logger.info(
            "Successfully scraped Wayback content",
            extra={"url": url, "bytes": content_length}
        )
        return response.text

    except requests.Timeout:
        logger.error(
            "Timeout scraping Wayback Machine",
            extra={"url": url, "timeout_seconds": 10}
        )
        raise ScrapingError(
            message=f"Request to {url} timed out after 10 seconds",
            error_code="SCRAPE_TIMEOUT",
            url=url
        )

    except requests.HTTPError as e:
        logger.error(
            "HTTP error scraping Wayback Machine",
            extra={
                "url": url,
                "status_code": e.response.status_code,
                "response_text": e.response.text[:200]
            }
        )
        raise ScrapingError(
            message=f"HTTP {e.response.status_code} for {url}: {e.response.reason}",
            error_code="SCRAPE_HTTP_ERROR",
            url=url
        )
```

**Logging Best Practices**:

- Use `extra={}` dict for structured data (enables JSON logging)
- Include correlation IDs for tracing requests across services
- Log timing information for performance debugging
- Never log sensitive data (passwords, tokens, PII)

### §5: Pragmatic Simplicity

**Principle**: Choose the simplest solution that solves the current problem. Optimize only after measuring performance bottlenecks.

**Mandatory Requirements**:

- **YAGNI enforcement**: Don't build features for hypothetical future needs. If "we might need this later" is the justification, don't build it
- **Boring technology preference**: Choose mature, well-documented libraries over cutting-edge/experimental ones. Stability > novelty
- **No premature optimization**: Performance optimization requires: (1) profiling to identify bottleneck, (2) benchmark showing improvement, (3) comment explaining why optimization was needed
- **Complexity justification**: When choosing a complex solution over a simple one, document the decision with: problem statement, why simple solution insufficient, specific benefits of complex approach

**Rationale**: zuga.ee is a personal portfolio site with <100 pages and <1000 monthly visitors. Over-engineering wastes time and creates maintenance burden. Simple solutions are easier to debug, modify, and understand 6 months later.

**Validation Method**: Code reviewers challenge complexity. "Why not just..." questions must be answered with data (profiling, benchmarks) or clear technical constraints.

**Example - Simple vs Premature Optimization**:

```python
# ❌ VIOLATION - Premature optimization with caching
from functools import lru_cache
import pickle
from pathlib import Path

@lru_cache(maxsize=1000)  # Caching for 10 pages?!
def load_content(slug: str) -> ContentDocument:
    """Load content with LRU cache (premature optimization)."""
    path = CONTENT_DIR / f"{slug}.md"
    with open(path) as f:
        content = f.read()
    # Complex pickle-based caching logic...
    return ContentDocument.parse(content)

# ✅ COMPLIANT - Simple file read
def load_content(slug: str) -> ContentDocument:
    """Load content from markdown file.

    Args:
        slug: Content slug (e.g., 'about', 'projects')

    Returns:
        Parsed content document

    Note: No caching implemented. If profiling shows this is slow,
    add caching with benchmark proving improvement (see issue #123).
    """
    path = CONTENT_DIR / f"{slug}.md"
    return ContentDocument.from_file(path)

# Later, if profiling shows it's actually slow:
# $ python -m cProfile -s cumulative scripts/benchmark.py
# Shows load_content() takes 50% of time
# THEN add caching with measured improvement
```

**Decision Framework - Simple vs Complex**:

Before choosing a complex solution, ask:

1. **Is there a simpler way?** Try the obvious approach first
2. **What's the actual scale?** Don't optimize for 1M users when you have 100
3. **What's the cost?** Count lines of code, dependencies added, concepts introduced
4. **What's the benefit?** Quantify improvement ("2x faster" not "might be better")

**When Complexity is Justified**:

- ✅ Clear performance bottleneck proven by profiling
- ✅ Required by external constraint (API rate limits, security requirement)
- ✅ Significantly better UX measured with real users
- ✅ Technical debt from simple solution exceeds complexity cost

**Common Simplicity Wins**:

- Files > Database for <1000 records
- Synchronous > Async for <100 req/sec
- Monolith > Microservices for <3 services
- Manual > Automated for <10 repetitions/month

---

## Tech Stack Governance

### Approved Dependencies

**Backend (Python)**:

- Framework: FastAPI (stable, well-documented)
- Validation: Pydantic v2 (strict typing)
- Testing: pytest + Hypothesis
- Security: python-jose, passlib

**Frontend (TypeScript)**:

- Framework: Next.js 14+ (App Router)
- Testing: Vitest + Testing Library
- UI: Start with vanilla CSS, add library only if needed

**Content**:

- Format: Markdown + YAML frontmatter (Obsidian-compatible)
- Storage: File-based (Git versioning)

### Adding New Dependencies

Before adding a dependency, ask:

1. Is it actively maintained? (commits in last 6 months)
2. Does it have good documentation?
3. Is the license compatible? (MIT, Apache 2.0, BSD)
4. Can we achieve this with existing dependencies?

Document the decision in a GitHub issue before adding.

### Upgrade Policy

- Minor/patch updates: Apply automatically (Dependabot)
- Major updates: Require review and testing
- Security patches: Apply immediately

---

## Code Quality Standards

### Required Checks (Pre-commit)

All commits must pass:

1. **Formatting**: black (Python), prettier (TypeScript)
2. **Linting**: flake8, eslint
3. **Type checking**: mypy --strict, tsc --noEmit
4. **Tests**: pytest, vitest
5. **Coverage**: 90% minimum

### Code Review Requirements

- All changes via pull requests (no direct commits to main)
- At least one approval required
- CI must pass (GitHub Actions)
- Constitution compliance checked by reviewer

### When to Break the Rules

Sometimes you need to violate a principle. When you do:

1. Add a comment explaining why (with issue reference)
2. Create a tech debt issue to fix it later
3. Get explicit approval in PR review

Example:

```python
# TODO(#42): Temporary `any` type until Pydantic v2.6 supports recursive models
content: Any  # type: ignore[misc]
```

---

## Workflow Processes

### Feature Development

1. **Specify**: Write requirements (what, why, acceptance criteria)
2. **Test**: Write failing tests
3. **Implement**: Make tests pass
4. **Review**: Submit PR with context
5. **Deploy**: Merge to main (CI/CD handles deployment)

### Content Changes

- Content editors can commit directly to `packages/content/`
- Developers require PR for code changes
- AI-generated content flagged with `ai_generated: true` in frontmatter

### Security Issues

- Report privately (don't open public issues)
- Fix before disclosing
- Update dependencies immediately

---

## AI Integration Principles

Since zuga.ee includes AI agents, we establish guardrails:

### 1. Human-in-the-Loop

**Principle**: AI suggests, humans approve.

**Rules**:

- AI cannot publish content without user confirmation
- AI cannot modify user permissions
- AI cannot execute destructive operations (delete, overwrite)

### 2. Attribution

**Principle**: AI-generated content must be traceable.

**Rules**:

- Frontmatter includes `ai_generated: true` and `ai_model: "gpt-4"` fields
- Git commits by AI tagged with `[AI]` prefix
- Users can see AI reasoning/prompt used

### 3. Model Flexibility

**Principle**: Don't lock into one LLM provider.

**Rules**:

- Abstract LLM calls behind interface (support OpenAI, Anthropic, local)
- User can choose preferred model
- Degrade gracefully if model unavailable

---

## Security Standards

### Authentication

- JWT tokens: 1 hour expiry, refresh tokens valid 7 days
- Magic links: 15-minute expiry, one-time use
- Passwords: bcrypt with cost factor 12

### Input Validation

- All API inputs validated with Pydantic models
- Markdown content sanitized (no `<script>` tags)
- File uploads limited to `.md`, `.jpg`, `.png`, `.pdf`

### Dependencies

- Automated security scanning (Dependabot, Snyk)
- Review vulnerability alerts within 48 hours
- Pin versions in production (no floating `^` in package.json)

---

## File-Based Content Rationale

**Why files instead of database?**

1. **Git versioning**: Every change tracked, easy rollback
2. **Obsidian compatibility**: Edit in your favorite Markdown editor
3. **Portability**: No database migrations, easy backups
4. **Simplicity**: Fewer moving parts

**Trade-offs accepted**:

- No full-text search (use static site search or grep)
- No complex queries (acceptable for 10-100 pages)
- Manual optimization if we hit performance issues (profile first)

---

## Anti-Patterns

Things we explicitly avoid:

### 1. Magic Numbers/Strings

```python
# ❌ BAD
if user.role == 3:
    ...

# ✅ GOOD
if user.role == UserRole.ADMIN:
    ...
```

### 2. God Objects

Avoid classes/components that do everything. Break them down.

### 3. Silent Failures

Never catch exceptions without logging or re-raising.

### 4. Callback Hell

Use async/await, not nested callbacks.

### 5. Premature Abstraction

Write code twice before abstracting. Three times is a pattern.

---

## Exceptions & Evolution

This constitution is not immutable. When you discover a principle needs updating:

1. Open a GitHub issue proposing the change
2. Discuss rationale and alternatives
3. Update constitution with PR
4. Increment version number

**Living Document**: This constitution evolves with the project.

---

**Signed**: Michele K.

**Date**: December 7, 2025
