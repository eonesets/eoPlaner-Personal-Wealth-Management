# eoPlaner

eoPlaner is a client-side personal finance application built with React. It provides tools for tracking monthly income, fixed and variable expenses, and calculates savings goals. All data is persisted locally in the browser.

## Features

- **Budget Tracking**: Manage total income, savings goals, and operational expenses. Balances and leftovers are calculated automatically.
- **Historical Archive**: Save completed month results and track financial progress over time.
- **Theming**: Supports Dark, Light, and a custom Pink theme.
- **Localization**: Interface is available in English (EN) and Russian (RU). Currency display options include USD, EUR, and RUB.
- **Local Storage**: Completely client-side. Data is stored in the browser's `localStorage` without requiring a backend.
- **Data Portability**: Export and import application data via JSON format.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion

## Getting Started

Prerequisites: Node.js (v18+ recommended).

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/eoplaner.git
   cd eoplaner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## License

This project is licensed under the Apache License 2.0.
