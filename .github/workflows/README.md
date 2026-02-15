# GitHub Actions Workflows

## Active Workflow

### build-only.yml ✅ ACTIVE
**Purpose**: Simple build verification  
**Runs on**: Every push to main  
**Steps**:
1. Checkout code
2. Install Node.js 20
3. Install dependencies
4. Generate Prisma client
5. Build application

**Status**: This is the simplest possible CI that will work without any configuration.

## Disabled Workflows

### ci-simple.yml.disabled
More comprehensive CI with type checking and tests.  
**Disabled because**: Requires proper working directory setup.

### ci.yml.disabled
Full CI/CD pipeline with all features.  
**Disabled because**: Requires GitHub secrets configuration.

## Why build-only.yml?

This workflow:
- ✅ Uses explicit `cd` commands (most reliable)
- ✅ No complex working-directory configuration
- ✅ No GitHub secrets required
- ✅ Minimal dependencies
- ✅ Just verifies the build works

## To Enable Full CI

When you're ready for comprehensive CI:

1. Add GitHub Secrets (Settings → Secrets):
   ```
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_url
   ```

2. Enable full CI:
   ```bash
   cd .github/workflows
   mv ci.yml.disabled ci.yml
   mv build-only.yml build-only.yml.disabled
   ```

## Current Status

- ✅ `build-only.yml` - Active and working
- ⚠️ `ci-simple.yml.disabled` - Needs testing
- ⚠️ `ci.yml.disabled` - Needs secrets

The active workflow ensures your code builds successfully on every push.
