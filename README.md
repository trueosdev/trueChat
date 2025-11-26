# trueChat

A modern, real-time chat application built with Next.js, Supabase, and reusable chat UI components.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery powered by Supabase Realtime
- **Authentication**: Secure user authentication with email/password
- **Direct Conversations**: One-on-one messaging between users
- **File Attachments**: Share images and files in conversations
- **Read Receipts**: Track message read status
- **User Presence**: See when users are online
- **Avatar Management**: Customizable user avatars with image cropping
- **Theme Support**: Dark and light mode with next-themes
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Emoji Picker**: Express yourself with emojis
- **Component Library**: Reusable chat components built on Radix UI

## 📦 Monorepo Structure

```
trueChat/
├── apps/
│   ├── www/           # Main chat application
│   └── docs/          # Component documentation (Nextra)
├── packages/
│   ├── ui/            # @shadcn-chat/ui - Reusable chat components
│   └── cli/           # CLI tool for adding components
└── supabase/          # Database migrations and schema
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Build System**: Turborepo
- **Language**: TypeScript

## 🏃 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 10.7.0 or higher
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trueChat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables for the www app:
```bash
cd apps/www
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run database migrations:
```bash
# Link your Supabase project and run migrations
supabase link --project-ref your-project-ref
supabase db push
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000` and docs at `http://localhost:3001`.

## 📚 Available Scripts

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps and packages
- `npm run lint` - Lint all apps and packages
- `npm run format` - Format code with Prettier
- `npm run generate-registry` - Generate component registry for CLI

## 🗄️ Database Schema

- **conversations**: Stores conversation metadata between two users
- **messages**: Stores individual messages with sender and content
- **read_receipts**: Tracks which messages have been read
- **attachments**: Stores file attachments metadata
- **users**: View of user profile data from auth.users

All tables include Row Level Security (RLS) policies for secure data access.

## 📦 Using the Component Library

Install the component library in your project:

```bash
npm install @shadcn-chat/ui
```

Import components:

```tsx
import { ChatBubble, ChatInput, ChatMessageList } from '@shadcn-chat/ui';
import '@shadcn-chat/ui/styles.css';
```

See the [documentation site](apps/docs) for detailed component usage.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the development process and how to submit pull requests.

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## 🔗 Links

- [Documentation](apps/docs) - Component documentation and examples
- [Supabase Docs](https://supabase.com/docs) - Learn more about Supabase
- [Next.js Docs](https://nextjs.org/docs) - Learn more about Next.js
