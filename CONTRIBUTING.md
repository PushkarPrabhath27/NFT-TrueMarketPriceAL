# Contributing to NFT TrustScore Platform

First off, thank you for considering contributing to the NFT TrustScore Platform! It's people like you that make this platform such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed and what behavior you expected
* Include screenshots if possible
* Include your environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

* Use a clear and descriptive title
* Provide a detailed description of the proposed functionality
* Explain why this enhancement would be useful
* List some examples of how it would be used

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style guidelines
6. Include appropriate comments in your code

## Development Process

### Setting Up Development Environment

```bash
# Clone your fork of the repo
git clone https://github.com/YOUR_USERNAME/nft-trustscore.git

# Navigate to the project directory
cd nft-trustscore

# Install dependencies
npm install

# Create a branch for your feature
git checkout -b feature/your-feature-name
```

### Code Style Guidelines

* Use TypeScript for all new code
* Follow the existing code style
* Use meaningful variable and function names
* Comment your code when necessary
* Keep functions focused and concise
* Use async/await for asynchronous operations
* Implement proper error handling

### Commit Guidelines

* Use clear and meaningful commit messages
* Reference issues and pull requests in commit messages
* Keep commits focused and atomic
* Use present tense ("Add feature" not "Added feature")

Example commit message:
```
feat(discovery): implement network health monitoring

- Add network health calculation
- Implement provider latency tracking
- Add health score events

Resolves #123
```

### Testing Guidelines

* Write unit tests for new functionality
* Ensure all tests pass before submitting PR
* Include integration tests when necessary
* Mock external services in tests
* Aim for high test coverage

### Documentation Guidelines

* Update README.md if necessary
* Document all new functions and classes
* Include JSDoc comments for TypeScript code
* Update API documentation for new endpoints
* Provide examples for new features

## Project Structure

```
src/
├── blockchain/          # Blockchain interaction logic
├── api/                 # API endpoints
├── services/            # Business logic
├── utils/               # Utility functions
└── types/               # TypeScript type definitions
```

## Review Process

1. Submit your PR with a clear description
2. Wait for CI checks to complete
3. Address any review comments
4. Keep PR discussion focused
5. Update your PR if needed

## Community

* Join our Discord server for discussions
* Participate in feature planning
* Help others in the community
* Share your experience using the platform

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for your contributions! 🙏