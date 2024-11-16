// src/app/(auth)/api/auth/discord/callback/route.ts
import { NextRequest } from 'next/server';
import { validateState } from '@/lib/auth/utils';
import { handleDiscordLogin } from '@/lib/auth/discord';

export const runtime = 'nodejs';

function createResponse(type: 'SUCCESS' | 'ERROR', data: any, baseUrl: string) {
  console.log(`Creating ${type} response with data:`, data);
  
  const safeData = type === 'ERROR' && data instanceof Error
    ? { message: data.message }
    : data;

  const response = new Response(`
    <!DOCTYPE html>
    <html>
      <head><title>Authentication ${type.toLowerCase()}</title></head>
      <body>
        <script>
          window.opener.postMessage({
            type: '${type}',
            data: ${JSON.stringify(safeData)}
          }, '${baseUrl}');
          setTimeout(() => window.close(), 1000);
        </script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });

  // If success, set the session cookie
  if (type === 'SUCCESS' && data?.data?.SessionTicket) {
    response.headers.append('Set-Cookie', `playfab_session=${data.data.SessionTicket}; Path=/; HttpOnly; SameSite=Lax`);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  
  try {
    console.log('Starting Discord callback...');
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');
    const storedState = request.cookies.get('discord_state')?.value;

    console.log('Auth params:', {
      code: code ? 'exists' : 'missing',
      returnedState,
      storedState,
    });

    if (!validateState(returnedState, storedState)) {
      console.error('State validation failed:', { returnedState, storedState });
      throw new Error('Invalid state parameter');
    }

    if (!code) {
      throw new Error('No code parameter received');
    }

    console.log('Exchanging code for token...');
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${baseUrl}/api/auth/discord/callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token received, getting user info...');

    const result = await handleDiscordLogin(tokenData.access_token);
    console.log('Login successful!');
    
    return createResponse('SUCCESS', result, baseUrl);

  } catch (error) {
    console.error('Auth error:', error);
    return createResponse(
      'ERROR',
      error instanceof Error ? error : new Error('Authentication failed'),
      baseUrl
    );
  }
}