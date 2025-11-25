# Contributing to trueChat

## Repository Access Rules

**Important**: Only the repository owner has push access to this repository.

### For Contributors

If you want to contribute:

1. **Fork the repository** to your own GitHub account
2. **Create a feature branch** in your fork
3. **Make your changes** and commit them
4. **Push to your fork**
5. **Create a Pull Request** from your fork to this repository
6. Wait for review and approval from the repository owner

### For Repository Owner

Direct pushes to `main` are allowed only for the repository owner.

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
4. Create `.env.local` with your credentials
5. Run migrations in Supabase SQL Editor
6. Start dev server: `npm run dev`

## Code Style

- Use TypeScript
- Follow existing code patterns
- Black and white color scheme only
- No AI chatbot code - person-to-person chat only
