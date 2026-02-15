# GitHub Actions Workflows

## Active Workflows

### ci-simple.yml (Recommended)
Simple CI pipeline that runs on every push to main branch:
- ✅ TypeScript type checking
- ✅ Unit tests
- ✅ Build verification

This workflow is designed to pass without requiring GitHub secrets.

### ci.yml (Advanced - Optional)
Full CI/CD pipeline with:
- Linting
- Type checking
- Unit tests
- E2E tests
- Build with coverage

**Note**: This requires GitHub secrets to be configured:
- `DATABASE_URL`
- `DIRECT_URL`

## Setup GitHub Secrets

If you want to use the full CI pipeline:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `DATABASE_URL`: Your database connection string
   - `DIRECT_URL`: Your direct database connection

## Disable Workflows

To disable a workflow, rename it with `.disabled` extension:
```bash
mv ci.yml ci.yml.disabled
```

## Current Status

- ✅ `ci-simple.yml` - Active and working
- ⚠️ `ci.yml` - Requires secrets configuration
