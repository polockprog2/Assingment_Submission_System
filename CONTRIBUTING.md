# Contributing to Assignment System API

Thank you for your interest in contributing to the Assignment System API! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites
- .NET 8 or later
- PostgreSQL
- Git

### Setting Up Development Environment

1. Clone the repository and open `AssignmentSystemApi.sln` in your editor.

2. Install dependencies:
   ```bash
   dotnet restore
   ```

3. Set up secrets (see the root `README.md` for details):
   ```bash
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=Submission_System;Username=postgres;Password=YOUR_PASSWORD"
   dotnet user-secrets set "Jwt:Key" "your-random-key-at-least-32-characters"
   ```

4. Build the project:
   ```bash
   dotnet build
   ```

5. Run the project:
   ```bash
   dotnet run --launch-profile http
   ```

## Development Workflow

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit with clear, descriptive messages:
   ```bash
   git commit -m "Add brief description of changes"
   ```

3. Push to your fork and create a pull request

## Code Standards

- Follow the [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- Use the `.editorconfig` file for consistent formatting
- Write meaningful commit messages
- Add comments for complex logic
- Follow SOLID principles

## Testing

- Write unit tests for new features
- Ensure existing tests pass before submitting a PR
- Test database migrations thoroughly

## Pull Request Process

1. Update documentation as needed
2. Ensure code compiles without warnings
3. Add/update tests for any new functionality
4. Request review from maintainers
5. Address feedback and re-request review

## Project Structure

```
backend/
├── Controllers/          # API endpoints
├── Services/            # Business logic
├── DTOs/                # Data Transfer Objects
├── Entities/            # Database models
├── Data/                # Database context and migrations
├── Middleware/          # Custom middleware
└── Common/              # Shared utilities
```

## Reporting Issues

- Use GitHub Issues to report bugs
- Provide clear reproduction steps
- Include relevant environment information

## Questions?

Feel free to open an issue or contact the maintainers directly.

Thank you for contributing!
