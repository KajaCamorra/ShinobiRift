import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return new Response('Discord OAuth configuration is missing', { status: 500 });
  }

  // Generate a random state parameter for security
  const state = randomBytes(32).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state: state,
  });

  // Create the response with all headers at once
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `https://discord.com/api/oauth2/authorize?${params.toString()}`,
      'Set-Cookie': `discord_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`
    }
  });
}
