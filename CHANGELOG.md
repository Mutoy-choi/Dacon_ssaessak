# Changelog

All notable changes to the Saessak (새싹) project will be documented in this file.

## [1.1.0] - 2025-11-12

### 🎉 Major Update - Animation & Theme System

#### ✨ New Features

**🌙 Dark/Light Mode Support**
- Automatic system theme detection
- Manual theme toggle button in header
- Smooth color transitions (0.3s)
- LocalStorage persistence
- CSS variable-based theming

**✨ Animation System**
- Level-up animations (2s scale, rotate, brightness effects)
- Particle explosion effects (30 colorful particles)
- Emotion change animations with color glow
- EXP gain popup animations (+XX EXP text)
- Image fade transitions (400-800ms)
- Breathing effect for idle state (3s pulse)
- Bounce scale, shimmer, and hover effects

**🎭 Real-time Expression Changes (Nano Banana Style)**
- Live facial expression updates during conversation
- Emotion-based subtle image editing
- 10 emotion-specific expressions
- Maintains design consistency (eyes, mouth only)
- Async processing (non-blocking)
- Fallback to current image on error

**🎨 Enhanced Image Prompt System**
- Emotion descriptors for all 10 emotions
- Level-specific style guides (11 levels)
- Event-specific prompts (levelup, milestone, achievement)
- Expression prompts for real-time changes
- Background style variations

#### 🛠️ Technical Improvements

**New Files:**
- `utils/theme.ts` - Theme management system
- `utils/animations.ts` - Animation utility functions
- `styles/animations.css` - Animation CSS definitions
- `components/ThemeToggle.tsx` - Theme toggle button
- `FEATURES_v1.1.md` - Feature documentation

**Updated Files:**
- `App.tsx` - Integrated theme and animation systems
- `index.html` - Added animation CSS, updated meta tags
- `services/llmService.ts` - Added `updateLiveExpression()` function

**New Animations:**
- `animate-level-up` - Level up celebration
- `animate-emotion-change` - Emotion transition
- `animate-exp-gain` - EXP popup
- `animate-pulse-breathing` - Idle breathing
- `animate-bounce-scale` - Bounce effect
- `glow-effect` - Glowing aura
- `celebration-particle` - Particle burst

#### 🎨 UI/UX Improvements
- Theme toggle button in header (sun/moon icons)
- Smooth color transitions for theme changes
- GPU-accelerated animations
- Reduced motion support for accessibility
- Better visual feedback for interactions

#### 📚 Documentation
- Added FEATURES_v1.1.md with comprehensive guide
- Updated CHANGELOG.md
- Animation timing guidelines
- Performance optimization notes

### 🐛 Bug Fixes
- Fixed image transition flickering
- Improved animation cleanup
- Enhanced error handling for image generation

### ⚡ Performance
- CSS variable-based theming (instant updates)
- GPU-accelerated animations (transform, opacity)
- Optimized particle effects
- Lazy image generation (only when needed)

### 🔐 Accessibility
- Prefers-reduced-motion detection
- Keyboard-accessible theme toggle
- ARIA labels for all interactive elements
- Focus-visible outlines

---

## [1.0.0] - 2025-11-12

### 🎉 Initial Release

#### ✨ Core Features
- **Multi AI Model Support**
  - Google Gemini (2.5 Flash, 2.5 Pro)
  - OpenAI (GPT-4o, GPT-4o mini, GPT-4 Turbo)
  - Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
  - OpenRouter (Multiple models integration)

- **Emotion Analysis System**
  - 10 emotion tracking (joy, sadness, outburst, irritable, timid, anxiety, flustered, envy, boredom, exhaustion)
  - Automatic emotion scoring (0.0 - 10.0) for each conversation
  - AI-powered conversation summary
  - Experience points (XP) generation based on conversation depth (5-25 XP)

- **Level Up & Growth System**
  - 11-level progression system (Infant → Singularity)
  - Automatic level-up based on accumulated XP
  - Dynamic character image generation on level-up
  - Emotion-based image transformation

- **AI Image Generation**
  - Gemini 2.5 Flash Image model integration
  - Pet expression changes based on emotions
  - Image continuity through base64 editing
  - Level-specific evolved appearance

- **Self-Reflection & Persona Dialogue**
  - `/pet reflect [question]` command for deep conversations
  - Personalized responses based on user's emotion history
  - Insights generation from major events and emotion patterns
  - Progressive persona refinement over time

- **Dashboard & Timeline**
  - Overall emotion profile visualization
  - Log history and major events timeline
  - Level progress and XP tracking
  - Character growth journey recording

#### 🎨 Enhanced Image Prompt System
- **Emotion-specific descriptors** for 10 different emotions
- **Level-based style guides** for character evolution
- **Multiple background styles** for variety
- **Event-specific prompts** (level-up, milestones, achievements)
- **Expression prompts** for real-time emotion display

#### 💾 Data Management
- **Export/Import Backup** functionality
  - Download pet data as JSON file
  - Upload backup file to restore data
  - Version-tracked backup format
- **Reset All Data** option with confirmation
- **LocalStorage** for secure client-side data storage

#### 🛠️ Technical Improvements
- TypeScript-based type-safe development
- React 19 with modern hooks
- Vite for fast development and building
- Markdown support with DOMPurify sanitization
- Streaming responses for better UX
- Error handling and user-friendly messages

#### 📚 Documentation
- Comprehensive README.md
- QUICKSTART.md for quick setup
- CONTRIBUTING.md for contributors
- PROJECT_SUMMARY.md for overview
- MIT License
- .env.local.example template

#### 🔐 Security & Privacy
- Local-only data storage (no server transmission)
- API keys stored securely in browser LocalStorage
- User-owned data with full control
- No external data transmission except to chosen AI models

### 🐛 Bug Fixes
- Fixed Gemini API key configuration
- Improved error handling for image generation
- Enhanced localStorage error recovery

---

## [Upcoming - v1.2]

### Planned Features
- [ ] Image caching system
- [ ] Animation customization options
- [ ] Theme-specific pet skins
- [ ] Voice conversation support
- [ ] Multiple pet management
- [ ] Advanced emotion statistics
- [ ] Social sharing features
- [ ] Mobile app version

---

## Development Notes

### Version Scheme
- Major version: Breaking changes or major feature additions
- Minor version: New features, backward compatible
- Patch version: Bug fixes and minor improvements

### Contributing
See CONTRIBUTING.md for guidelines on how to contribute to this project.

---

**Made with 💚 by Team Saessak**
