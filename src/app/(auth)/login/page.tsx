// src/app/(auth)/login/page.tsx
import { DiscordLoginButton } from '@/components/auth/DiscordLoginButton';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center">Login to Shinobi Rift</h1>
        <DiscordLoginButton />
      </div>
    </div>
  );
}