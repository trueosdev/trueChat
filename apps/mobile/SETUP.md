# TrueChat Mobile App Setup

This is the React Native (Expo) mobile app for TrueChat, built with:

- **Expo SDK 54** - Latest Expo framework
- **Expo Router** - File-based navigation (similar to Next.js)
- **NativeWind** - Tailwind CSS for React Native
- **Supabase** - Backend services (auth, database, realtime)
- **Zustand** - State management

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for development)
- iOS Simulator / Android Emulator (optional)

## Quick Start

### 1. Install dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `apps/mobile/` with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Use the same Supabase project as your web app (`apps/www/.env.local`)

### 3. Start the development server

```bash
npm start
```

### 4. Run on device/simulator

- **iOS Simulator**: Press `i`
- **Android Emulator**: Press `a`
- **Expo Go**: Scan the QR code with your phone

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (login, signup)
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Conversations list
│   │   └── profile.tsx    # User profile
│   ├── chat/[id].tsx      # Individual chat screen
│   └── modal.tsx          # New chat modal
├── components/            # Reusable components
├── hooks/                 # React hooks (useChatStore, etc.)
├── lib/                   # Shared code
│   ├── auth/             # Auth provider
│   ├── services/         # API services (messages, conversations)
│   ├── supabase/         # Supabase client
│   └── types/            # TypeScript types
├── assets/               # Images, fonts
├── tailwind.config.js    # Tailwind/NativeWind config
└── app.json              # Expo config
```

## Key Features

- ✅ Authentication (Login/Signup)
- ✅ Real-time messaging
- ✅ Conversation list with last message preview
- ✅ Individual chat screens
- ✅ User search & new chat creation
- ✅ Dark mode by default
- ✅ Profile screen with settings

## Shared Code with Web App

The mobile app shares types and business logic patterns with the web app:

- **Types**: `lib/types/index.ts` matches web app types
- **Services**: API calls use the same Supabase tables
- **State**: Zustand store structure is similar

## Building for Production

### iOS

```bash
npx eas build --platform ios
```

### Android

```bash
npx eas build --platform android
```

### Both platforms

```bash
npx eas build --platform all
```

## Troubleshooting

### Clear cache

```bash
npx expo start --clear
```

### Reset Metro bundler

```bash
rm -rf node_modules/.cache
```

### Reinstall dependencies

```bash
rm -rf node_modules
npm install
```

