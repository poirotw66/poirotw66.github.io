---
title: "Clubhouse Games"
description: "A collection of web-based implementations of Clubhouse Games: featuring game specifications and rules. Implementations are placed under Games/ and can be accessed via the games overview menu. Includes Blackjack, Tetris, Othello, Tank Battle, etc. Single service, GitHub Pages deployment."
pubDate: 2025-03-16
updatedDate: 2025-03-16
tldr:
  - "A collection of web-based implementations of Clubhouse Games: featuring game specifications and rules"
  - "Implementations are placed under Games/ and can be accessed via the games overview menu"
  - "Includes Blackjack, Tetris, Othello, Tank Battle, etc"
  - "Single service, GitHub Pages deployment"
audience:
  - "Engineers, technical leads, and product teams evaluating real project architecture, trade-offs, and delivery results."
  - "Readers who want concrete outcomes and stack choices, not just a concept demo."
tier: lab
subtitle: "Game Spec Overview · Unified Menu · GitHub Pages · TypeScript"
repoUrl: "https://github.com/poirotw66/Clubhouse-Games"
metrics:
  - "TypeScript · HTML"
  - "Single Dev Server"
  - "22 Game Specs"
impact: "Multiple Clubhouse Games web implementations with a unified menu and deploy path"
image: "https://github.com/poirotw66/Clubhouse-Games/raw/main/title-image.png"
---

This project features specifications and web-based implementations of several **Clubhouse Games (51 Worldwide Games)**. We have standardized the specifications for various classic games and implemented them as independent web pages. Through a unified "Games Overview Menu", we integrate the entry points, allowing users to experience multiple mini-games directly in their browsers.

The project contains specifications for over 20 games ranging from cards and boards to puzzle and sports games. It includes implementations for classic titles such as Blackjack, Othello, and Klondike.

---

## 1. Game Overview and Classification Structure

For ease of management, the games are divided into multiple categories. The source code and specification documents are also arranged according to this structure:

- **01 Cards (4 games)**: Blackjack, FreeCell, Klondike, Last Card
- **02 Board (3 games)**: Othello, Checkers, Connect Four
- **03 Tiles and Dice (2 games)**: Dominoes, Yacht Dice
- **04 Sports and Arcade (5 games)**: Toy Tennis / Soccer / Boxing / Baseball, Badminton Smash Training
- **05 Puzzle (3 games)**: Mystery Liquid Sort, Takoyaki, Tetris
- **06 Mini-Games (5 games)**: Carrom, Slot Cars, Color Guessing, Tank Battle, Samurai Reflex Training

*(For detailed specifications, please refer to the specification documents under each category folder in the [GitHub Repository](https://github.com/poirotw66/Clubhouse-Games))*

---

## 2. System Architecture and Overview Menu

The core architecture of this project uses a single `index.html` site homepage as the "Overview Menu", while all game implementations are independently placed under the `Games/` directory.

![Game Console](https://github.com/poirotw66/Clubhouse-Games/raw/main/title-image.png)

- **Overview Menu**: Responsible for displaying the game list and handling entry point redirection.
- **Sub-game Implementations**: Each game is independently developed and bundled, for example, `Games/Blackjack-main/`.
- **Single Development Server**: When developing locally, you only need to start one dev server. The menu and all built games will be served on the same port, eliminating the hassle of managing multiple microservices.

---

## 3. Implemented Game Examples

The game examples that are currently built and integrated into the system include:

- **Blackjack** (`Games/Blackjack-main/`)
- **FreeCell** (`Games/FreeCell/`)
- **Last Card** (`Games/Last-Card/`)
- **Klondike** (`Games/Klondike/`)
- **Badminton Smash Training** (`Games/Block-the-smash/`)
- **Samurai Reflex Training** (`Games/Instant-Flash/`)
- **Mystery Liquid Sort** (`Games/Mystery-Liquid-Sort/`)

---

## 4. Local Development and Startup Process

The project adopts frontend technologies such as TypeScript, and each game can be built independently:

1. **Install root directory dependencies**:
   ```bash
   npm install
   ```
2. **Install sub-project dependencies** (if a new game is added):
   ```bash
   cd Games/Blackjack-main && npm install && cd ../..
   ```
3. **Build the specified game** (compile the sub-game output and make it ready):
   ```bash
   npm run build:game Blackjack-main
   ```
4. **Start the unified development server**:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` to see the overview menu. Click "Enter Game" to seamlessly switch to the built sub-game.

---

## 5. Deployment to GitHub Pages

The project supports bundling the menu and all built sub-games, and publishing them to GitHub Pages. The related build processes, CI scripts, and the local `build:pages` task are documented in `docs/DEPLOYMENT.md`, ensuring the consistency and convenience of automated deployment.
