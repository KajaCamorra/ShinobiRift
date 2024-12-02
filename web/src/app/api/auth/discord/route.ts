import { NextResponse } from 'next/server';
import { PlayFabClient } from 'playfab-sdk';

const DEBUG = true;
const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';

export async function GET(request: Request) {
  try {
    if (DEBUG) {
      console.log('[Discord Auth] Starting Discord authentication');
      console.log('[Discord Auth] Environment:', {
        hasClientId: !!DISCORD_CLIENT_ID,
        hasClientSecret: !!DISCORD_CLIENT_SECRET,
        redirectUri: DISCORD_REDIRECT_URI
      });
    }

    if (!DISCORD_CLIENT_ID) {
      throw new Error('Discord Client ID not configured');
    }

    if (!DISCORD_CLIENT_SECRET) {
      throw new Error('Discord Client Secret not configured');
    }

    // Generate OAuth URL
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: 'identify',
    });

    const oauthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    
    if (DEBUG) {
      console.log('[Discord Auth] Redirecting to Discord OAuth:', oauthUrl);
    }

    // Redirect directly to Discord OAuth
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('[Discord Auth] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start Discord authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
