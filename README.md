# Gitty - Git Learning Game

A fun, interactive puzzle game that teaches git commands through hands-on gameplay. Master git concepts by solving daily puzzles where you collect files scattered across branches and merge them to main.

![Gitty Game](https://img.shields.io/badge/game-gitty-brightgreen)
![React](https://img.shields.io/badge/react-18-blue)
![TypeScript](https://img.shields.io/badge/typescript-5-blue)
![Vite](https://img.shields.io/badge/vite-7-purple)

## Features

✨ **Interactive Git Learning**
- Learn git commands by playing
- Real-time terminal feedback
- Step-by-step tutorials for beginners

**Daily Puzzle Challenges**
- New puzzle every day
- Varying difficulty levels
- Par scoring system to measure efficiency

**Progress Tracking**
- Leaderboard rankings
- Statistics and achievements
- Archive of completed puzzles

**Multiple Git Commands**
- `git commit` - Create commits
- `git branch` - Create and manage branches
- `git checkout` - Switch between branches
- `git merge` - Merge branches together
- `git rebase` - Rebase onto branches
- `git undo` - Undo last command

**Dark Mode Support**
- Full dark/light mode theming
- Persistent theme preference
- Smooth transitions

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or bun package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/gitty.git
cd gitty
```

2. Install dependencies
```bash
bun install
# or
npm install
```

3. Start the development server
```bash
bun run dev
# or
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## How to Play

### Game Objective
Collect all target files by creating commits at specific positions, then merge everything to the main branch to complete the puzzle.

### Game Mechanics

1. **Files & Positions**: Files are placed at specific positions defined by a `branch` and `depth` (number of commits from initial commit)

2. **Collecting Files**: When you create a commit at the exact position where a file is located, you automatically collect that file

3. **Winning**: Merge all collected files to the main branch to win

4. **Scoring**: 
   - Base score: 100 points
   - Under par: +20 points per command saved
   - Over par: -10 points per extra command (minimum 10 points)

### Example Game Flow
```
$ git init                    # Start the puzzle
$ git commit -m "first"       # Create your first commit
$ git branch feature          # Create a new branch
$ git checkout feature        # Switch to the feature branch
$ git commit -m "second"      # Create a commit on feature
$ git checkout main           # Switch back to main
$ git merge feature           # Merge feature into main
```

## Project Structure

```
gitty/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── CommandHistory.tsx
│   │   ├── CommandInput.tsx
│   │   ├── FileTracker.tsx
│   │   ├── GameEndModal.tsx
│   │   ├── GameStatusBar.tsx
│   │   ├── GitGraph.tsx
│   │   ├── SetNameModal.tsx
│   │   └── TutorialModal.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useApiGame.ts
│   │   └── useGame.ts
│   ├── layouts/              # Layout components
│   │   └── MainLayout.tsx
│   ├── lib/                  # Utilities and API
│   │   ├── api.ts            # API client
│   │   ├── colors.ts         # Color configuration
│   │   ├── gitEngine.ts      # Git logic
│   │   ├── types.ts          # TypeScript types
│   │   └── utils.ts          # Helper functions
│   ├── pages/                # Page components
│   │   ├── ArchivePage.tsx
│   │   ├── GamePage.tsx
│   │   ├── HelpPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   └── StatsPage.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/                   # Static assets
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Technologies Used

- **Frontend Framework**: React 18
- **Language**: TypeScript 5
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v6
- **State Management**: React Hooks & Context API
- **API Communication**: Fetch API with IP-based authentication
- **Package Manager**: Bun

## API Integration

Gitty uses a REST API for game state management. The API handles:
- Game initialization and state management
- Command execution and validation
- Puzzle retrieval and management
- Score calculation and leaderboard data

**API Base URL**: `https://gitty-api.phanuphats.com`

Authentication is IP-based, no tokens required.

## Dark Mode

Gitty includes full dark mode support with:
- Global dark mode toggle in the navbar
- Persistent theme preference using localStorage
- Tailwind CSS for consistent theming across all pages
- Smooth transitions between light and dark modes

## Development

### Available Scripts

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Type checking
npx tsc --noEmit

# Lint and format (if configured)
bun run lint
```

### Building for Production

```bash
bun run build
```

The build output will be in the `dist/` directory.

## Color System

Gitty uses a centralized color configuration in `src/lib/colors.ts` for consistent theming across the application.

### Color Categories
- **Backgrounds**: Primary, secondary, tertiary levels
- **Text**: Primary, secondary, tertiary, muted, links
- **Borders**: Standard and divider variants
- **Buttons**: Primary, secondary, ghost styles
- **Components**: Tables, cards, badges, dropdowns

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- Game mechanics inspired by Git learning principles
- UI powered by Tailwind CSS and Lucide icons
- Hosted and deployed on Netlify

## Support

For issues, questions, or suggestions, please:
- Open an issue on GitHub
- Check the Help page in-game for tutorials
- Visit the Leaderboard to see how others are doing

---

**Happy learning! Master git one puzzle at a time.** 🎮
