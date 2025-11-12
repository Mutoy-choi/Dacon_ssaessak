# Contributing to Saessak (새싹)

Thank you for your interest in contributing to Saessak! 🌱

This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## 🤝 Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git
- Google Gemini API Key (get from https://ai.google.dev/)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/dacon_saessak.git
   cd dacon_saessak
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   
   # Edit .env.local and add your Gemini API key
   # API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to http://localhost:5173

---

## 🔄 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch (merge features here first)
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes

### Working on a Feature

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add comments where necessary

3. **Test your changes**
   ```bash
   npm run build
   npm run preview
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR from your branch to `develop`

---

## 📁 Project Structure

```
dacon_saessak/
├── index.html                 # HTML entry point
├── index.tsx                  # React entry point
├── App.tsx                    # Main app component
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Constants (levels, emotions, etc.)
├── imagePrompts.ts            # Image generation prompt system
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
├── .env.local                 # Environment variables (not in git)
├── .env.local.example         # Example env file
├── README.md                  # Main documentation
├── CHANGELOG.md               # Version history
├── LICENSE                    # MIT License
│
├── components/
│   ├── ChatWindow.tsx         # Chat display
│   ├── Message.tsx            # Message component
│   ├── PromptInput.tsx        # Input field
│   ├── Sidebar.tsx            # Navigation sidebar
│   ├── PetDashboard.tsx       # Pet stats dashboard
│   ├── PetSetup.tsx           # Initial pet creation
│   ├── PetStatus.tsx          # Pet status display
│   ├── SettingsModal.tsx      # Settings & backup modal
│   └── icons.tsx              # Icon components
│
├── services/
│   └── llmService.ts          # AI model communication
│
├── utils/
│   └── storage.ts             # LocalStorage utilities
│
└── assets/
    └── petImages.ts           # Default pet images (Base64)
```

---

## 📝 Coding Standards

### TypeScript

- **Use TypeScript** for all new files
- **Define types** explicitly for function parameters and return values
- **Use interfaces** for object shapes
- **Avoid `any` type** unless absolutely necessary

```typescript
// ✅ Good
interface PetState {
  name: string;
  level: number;
}

function updatePet(state: PetState): PetState {
  return { ...state, level: state.level + 1 };
}

// ❌ Bad
function updatePet(state: any): any {
  return state;
}
```

### React Components

- **Use functional components** with hooks
- **Extract complex logic** into custom hooks
- **Use descriptive names** for components and props
- **Add PropTypes or TypeScript interfaces** for all props

```typescript
// ✅ Good
interface MessageProps {
  content: string;
  role: 'user' | 'model' | 'system';
  timestamp: string;
}

export const Message: React.FC<MessageProps> = ({ content, role, timestamp }) => {
  // Component logic
};

// ❌ Bad
export const Message = (props) => {
  // Component logic
};
```

### Styling

- **Use Tailwind CSS classes** for styling
- **Keep consistent spacing** and color schemes
- **Use existing color variables** (purple-500, pink-500, gray-800, etc.)

### Comments

- **Add JSDoc comments** for functions
- **Explain complex logic** with inline comments
- **Update comments** when code changes

```typescript
/**
 * Analyzes user's log entry and calculates emotion scores
 * @param log - User's text input
 * @returns LogAnalysis with emotions and XP
 */
export async function analyzeLog(log: string): Promise<LogAnalysis> {
  // Implementation
}
```

---

## 💬 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(emotion): add exhaustion detection algorithm

Implemented a new algorithm to better detect exhaustion
patterns in user's conversation history.

Closes #42

---

fix(image): resolve Base64 encoding issue

Fixed a bug where image generation would fail for
certain emotion combinations.

---

docs(readme): update installation instructions

Added more detailed steps for Windows users.
```

---

## 🔀 Pull Request Process

1. **Update documentation** if needed
2. **Add/update tests** if applicable
3. **Ensure code builds** without errors
4. **Update CHANGELOG.md** with your changes
5. **Create descriptive PR title** following commit guidelines
6. **Fill out PR template** with details
7. **Request review** from maintainers
8. **Address review comments** promptly

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Tested in development environment
- [ ] CHANGELOG.md updated

---

## 🐛 Reporting Bugs

### Before Reporting

1. **Check existing issues** to avoid duplicates
2. **Test in latest version** to ensure bug still exists
3. **Collect relevant information** (browser, OS, steps to reproduce)

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

---

## 💡 Feature Requests

We welcome feature suggestions! Please use this template:

```markdown
**Feature Description**
Clear description of the feature.

**Problem it solves**
What problem does this feature address?

**Proposed Solution**
Your idea for implementing the feature.

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Mockups, examples, or related features.
```

---

## 🎯 Priority Areas

We're especially interested in contributions for:

1. **Image Generation**
   - Nano Banana model integration
   - Animation effects
   - Expression variations

2. **Emotion Analysis**
   - Pattern detection algorithms
   - Sentiment refinement
   - Long-term tracking

3. **UI/UX**
   - Accessibility improvements
   - Mobile responsiveness
   - Dark mode

4. **Features**
   - Voice conversation
   - Multiple pets
   - Social sharing

5. **Documentation**
   - Tutorials
   - API documentation
   - Localization

---

## 📞 Contact

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Email**: [Your contact email]

---

## 🙏 Thank You!

Every contribution, no matter how small, is valuable. Thank you for helping make Saessak better! 💚

---

**Made with 💚 by Team Saessak**
