# Contributing Guide

Thank you for your interest in contributing to the LLM Podcast Engine! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/llm-podcast-engine.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -m "Add: your feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

1. Install dependencies:
```bash
npm install
# or
bun install
```

2. Set up environment variables (see `.env.example`)

3. Run the development server:
```bash
npm run dev
```

4. Run linting:
```bash
npm run lint
```

## Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Commit Messages

Use clear, descriptive commit messages:

- `Add: feature description` - for new features
- `Fix: bug description` - for bug fixes
- `Update: what was updated` - for updates
- `Refactor: what was refactored` - for refactoring
- `Docs: what documentation was added/changed` - for documentation

## Pull Request Process

1. Ensure your code follows the project's code style
2. Make sure all tests pass (if applicable)
3. Update documentation if needed
4. Add a clear description of your changes
5. Reference any related issues

## Areas for Contribution

### High Priority

- [ ] Error handling improvements
- [ ] Loading states and user feedback
- [ ] Audio file cleanup mechanism
- [ ] URL validation improvements
- [ ] Rate limiting implementation

### Features

- [ ] Custom prompt templates
- [ ] Podcast scheduling
- [ ] RSS feed generation
- [ ] Audio editing (intro/outro)
- [ ] Multiple language support
- [ ] Export options (MP3, WAV, etc.)

### Technical Improvements

- [ ] Database integration for storing podcasts
- [ ] User authentication
- [ ] Caching layer for scraped content
- [ ] Retry logic for API calls
- [ ] WebSocket support
- [ ] Unit tests
- [ ] E2E tests

### Documentation

- [ ] API usage examples
- [ ] Deployment guides
- [ ] Troubleshooting guide
- [ ] Video tutorials

## Questions?

If you have questions or need help, please open an issue or start a discussion.

Thank you for contributing! 🎉

