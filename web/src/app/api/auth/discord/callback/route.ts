import { NextResponse } from 'next/server';
import { PlayFabClient } from 'playfab-sdk';

const DEBUG = true;
const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';

if (!PlayFabClient.IsClientLoggedIn() && process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID) {
  PlayFabClient.settings.titleId = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID;
}

export async function GET(request: Request) {
  try {
    if (DEBUG) {
      console.log('[Discord Callback] Processing Discord callback');
    }

    // Get the authorization code from the URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error || errorDescription) {
      throw new Error(errorDescription || error || 'Discord authorization failed');
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    if (DEBUG) {
      console.log('[Discord Callback] Received authorization code');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('[Discord Callback] Token exchange error:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    if (DEBUG) {
      console.log('[Discord Callback] Received access token');
    }

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      console.error('[Discord Callback] User info error:', errorData);
      throw new Error('Failed to get user info from Discord');
    }

    const userData = await userResponse.json();

    if (DEBUG) {
      console.log('[Discord Callback] Received Discord user data:', {
        id: userData.id,
        username: userData.username
      });
    }

    // Login with PlayFab using Discord ID
    const customId = `discord_${userData.id}`;
    
    if (DEBUG) {
      console.log('[Discord Callback] Attempting PlayFab login with ID:', customId);
    }

    const result = await new Promise((resolve, reject) => {
      PlayFabClient.LoginWithCustomID({
        CustomId: customId,
        CreateAccount: true,
        InfoRequestParameters: {
          GetUserAccountInfo: true,
          GetPlayerProfile: true,
          GetUserInventory: false,
          GetUserVirtualCurrency: false,
          GetUserData: false,
          GetPlayerStatistics: false,
          GetTitleData: false,
          GetUserReadOnlyData: false,
          GetCharacterList: false,
          GetCharacterInventories: false
        }
      }, (error, result) => {
        if (error) {
          console.error('[Discord Callback] PlayFab login error:', error);
          reject(error);
        } else {
          console.log('[Discord Callback] PlayFab login success:', {
            playFabId: result.data.PlayFabId,
            hasSessionTicket: !!result.data.SessionTicket
          });
          resolve(result);
        }
      });
    });

    // Return success response with login data
    const loginData = {
      data: result,
      discordId: userData.id
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Discord Login Success</title>
        </head>
        <body>
          <script>
            try {
              window.opener.postMessage({
                type: 'SUCCESS',
                data: ${JSON.stringify(loginData).replace(/</g, '\\u003c')}
              }, window.location.origin);
            } catch (err) {
              console.error('Failed to post message:', err);
            } finally {
              window.close();
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('[Discord Callback] Error:', error);
    
    // Return error page that posts message to opener
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Discord Login Error</title>
        </head>
        <body>
          <script>
            try {
              window.opener.postMessage({
                type: 'ERROR',
                data: {
                  message: ${JSON.stringify(errorMessage).replace(/</g, '\\u003c')}
                }
              }, window.location.origin);
            } catch (err) {
              console.error('Failed to post message:', err);
            } finally {
              window.close();
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
