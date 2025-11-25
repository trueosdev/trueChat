# trueChat

trueChat is for the trueOS team. Built with https://github.com/jakobhoeg/shadcn-chat.git.

## Repository Rules

**Push Access**: Only the repository owner can push directly to this repository. All other contributors should fork and create pull requests.

**Safety**: A git pre-push hook requires human confirmation before any push. Automated agents cannot push without explicit approval.

## Setup

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Create `apps/www/.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```