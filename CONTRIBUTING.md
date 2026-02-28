# Contributing to Kapilla Logistics

Thank you for your interest in contributing to Kapilla Logistics! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database (or Supabase account)
- Git

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/kapilla-logistics.git
   cd kapilla-logistics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

## Code Standards

### Linting and Formatting
- We use ESLint for linting and Prettier for code formatting
- Run `npm run lint` to check for issues
- Run `npm run format` to auto-format code
- Pre-commit hooks will automatically run these checks

### TypeScript
- All new code should be written in TypeScript
- Avoid using `any` types when possible
- Run `npm run type-check` to verify types

### Testing
- Write unit tests for utility functions and business logic
- Write E2E tests for critical user flows
- Run `npm run test` before submitting PRs
- Aim for >80% code coverage

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new shipment tracking feature
fix: resolve login authentication bug
docs: update API documentation
style: format code with prettier
refactor: restructure auth module
test: add tests for shipment service
chore: update dependencies
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run test:e2e
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Wait for code review

## Code Review

- All PRs require at least one approval
- Address review comments promptly
- Keep PRs focused and reasonably sized
- Squash commits before merging

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Provide detailed reproduction steps for bugs
- Include system information and error messages
- Search existing issues before creating new ones

## Questions?

Feel free to open a discussion or reach out to the maintainers.

Thank you for contributing! 🚀
