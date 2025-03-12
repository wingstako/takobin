# TakoBin - Modern Paste Bin Alternative

TakoBin is a modern paste bin alternative built with Next.js, TypeScript, and tRPC. It provides a clean and intuitive interface for sharing code snippets, text, and files with others.

## Features

- **Syntax Highlighting** - Share code with beautiful syntax highlighting for over 100 programming languages
- **File Uploads** - Upload images, videos, and other files alongside your text pastes
- **Password Protection** - Secure your pastes with password protection for sensitive content
- **Expiry Dates** - Set expiry dates for your pastes. They'll be automatically extended when viewed
- **User Accounts** - Create an account to manage your pastes and access additional features

## How It Works

Create a paste, set an expiry date, and share the link. Your paste will be accessible for up to 30 days for registered users, or 7 days for guests. Each time someone views your paste, the expiry date is automatically extended.

## Technology Stack

- **Next.js** - React framework for server-rendered applications
- **TypeScript** - Typed JavaScript for better developer experience
- **tRPC** - End-to-end typesafe APIs
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautifully designed components
- **Drizzle ORM** - TypeScript ORM for SQL databases

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/takobin.git
   cd takobin
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [T3 Stack](https://create.t3.gg/) - The starting point for this project
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Shiki](https://shiki.matsu.io/) - Syntax highlighting
