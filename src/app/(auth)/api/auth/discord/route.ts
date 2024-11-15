import { NextRequest, NextResponse } from 'next/server';
import { generateState } from '@/lib/auth/utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('Starting Discord auth...'); // Debug log
  const state = generateState();
  
  const discordUrl = new URL('https://discord.com/api/oauth2/authorize');
  discordUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
  discordUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`);
  discordUrl.searchParams.set('response_type', 'code');
  discordUrl.searchParams.set('scope', 'identify email');
  discordUrl.searchParams.set('state', state);

  console.log('Discord URL:', discordUrl.toString()); // Debug log

  const response = NextResponse.redirect(discordUrl);
  
  response.cookies.set('discord_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5 // 5 minutes
  });

  return response;
}