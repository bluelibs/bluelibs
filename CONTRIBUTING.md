# Contributing to BlueLibs

Thank you for your interest in contributing to BlueLibs! This document provides guidelines and standards for contributing to this monorepo.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to:

- Being respectful and inclusive
- Welcoming newcomers
- Focusing on constructive feedback
- Prioritizing user experience

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/bluelibs/bluelibs.git
cd bluelibs

# Install dependencies
npm install

# Bootstrap all packages (links cross-dependencies)
npm run bootstrap

# Build all packages
npm run build

# Run tests
npm test
```

## Development Workflow

### Branch Naming

Use the following branch naming conventions:

- `feature/{package}/{issue-number}-short-description` - New features
- `fix/{package}/{issue-number}-short-description` - Bug fixes
- `docs/{package}/short-description` - Documentation updates
- `deps/{package}/dependency-name` - Dependency updates
- `refactor/{package}/short-description` - Code refactoring

Examples:

- `feature/mongo-bundle/143-add-transaction-support`
- `fix/core/256-memory-leak-fix`
- `docs/nova/update-readme`

### Monorepo Development

We use Lerna for monorepo management:

```bash
# Link packages for local development
npx lerna link

# Watch changes in a specific package
cd packages/core && npm run watch

# Run tests in a specific package
cd packages/core && npm run test:dev

# Add dependency to a package
npx lerna add {dependency} --scope={package-name}
```

## Coding Standards

### TypeScript

All packages must use TypeScript with strict mode enabled:

- Target: ES2022
- Strict mode: enabled
- No implicit any
- Strict null checks
- Explicit return types on public APIs

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npx prettier --write "src/**/*.{ts,tsx}"
```

### Key Style Rules

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Maximum line length: 100 characters
- Use trailing commas (ES5 style)

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `event-manager.ts`)
- **Classes**: `PascalCase` (e.g., `EventManager`)
- **Interfaces**: `PascalCase` with no `I` prefix (e.g., `BundleConfig`)
- **Functions/Methods**: `camelCase` (e.g., `getBundle`)
- **Constants**: `SCREAMING_SNAKE_CASE` for true constants
- **Private members**: Prefix with `_` (e.g., `_privateMethod`)
- **Generic types**: Single uppercase letters (e.g., `T`, `K`, `V`)

### Architecture Principles

1. **SOLID Principles**: Follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
2. **Dependency Injection**: Use the core DI container for all dependencies
3. **Bundle Architecture**: All functionality should be organized into bundles
4. **Event-Driven**: Use events for loose coupling between components
5. **Type Safety**: Avoid `any` types; use `unknown` and type guards when necessary

## Testing Requirements

### Test Coverage

- Minimum 80% coverage for all new code
- 100% coverage for critical paths (security, data handling)
- All public APIs must have tests

### Test Structure

```typescript
// Example test structure
describe("FeatureName", () => {
  describe("methodName", () => {
    it("should do something when condition", async () => {
      // Arrange
      const input = {};

      // Act
      const result = await feature.method(input);

      // Assert
      expect(result).to.equal(expected);
    });

    it("should throw error when invalid input", async () => {
      // Test error cases
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
cd packages/{name} && npm run test:dev

# Run tests with coverage
cd packages/{name} && npm run coverage
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **deps**: Dependency updates

### Scopes

Use package names as scopes:

- `core`
- `mongo-bundle`
- `x-ui`
- `nova`
- etc.

### Examples

```
feat(core): add support for bundle priorities

fix(mongo-bundle): resolve race condition in transactions

docs(nova): update API documentation for links

deps(x-ui): update react to 18.x

refactor(security-bundle): simplify permission checking
```

## Pull Request Process

### Before Submitting

1. **Tests**: Ensure all tests pass
2. **Linting**: Run `npm run lint` and fix all issues
3. **Formatting**: Run Prettier on all changed files
4. **Documentation**: Update relevant documentation
5. **Type Checking**: Ensure TypeScript compiles without errors

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist

- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Changes are backward compatible (or marked as breaking)

## Related Issues

Fixes #(issue number)
```

### Review Process

1. All PRs require at least one review from a CODEOWNER
2. CI checks must pass (tests, linting, security audit)
3. Address all review comments before merging
4. Use "Squash and Merge" to keep clean history

## Release Process

We use Lerna for automated releases:

```bash
# Version and tag packages
npm run version

# Publish to npm
npm run publish
```

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Changelog

Changelogs are automatically generated from conventional commits.

## Questions?

- Join our [Discord](https://discord.com/invite/GmNeRDqxvp)
- Open an issue for discussion
- Check existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
