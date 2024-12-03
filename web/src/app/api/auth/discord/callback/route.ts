import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('Discord callback received:', {
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      error,
      errorDescription
    });

    // Verify state parameter
    const cookieStore = cookies();
    const storedState = cookieStore.get('discord_oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      console.error('Invalid OAuth state:', { storedState, receivedState: state });
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage(
                {
                  type: 'ERROR',
                  data: { message: 'Invalid OAuth state' }
                },
                window.location.origin
              );
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    if (error || !code) {
      console.error('Discord callback error:', { error, errorDescription });
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage(
                {
                  type: 'ERROR',
                  data: { message: '${errorDescription || error || 'No authorization code received'}' }
                },
                window.location.origin
              );
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    console.log('Exchanging code for tokens...');
    // Exchange the code for tokens
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ discordCode: code }),
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error('Failed to authenticate with Discord');
    }

    const data = await response.json();
    console.log('API response data:', {
      sessionToken: data.sessionToken ? 'present' : 'missing',
      accessToken: data.accessToken ? 'present' : 'missing',
      expiresIn: data.expiresIn,
      playFabId: data.playFabId ? 'present' : 'missing',
      displayName: data.displayName ? 'present' : 'missing'
    });

    // Get the session cookie from the response
    const setCookieHeader = response.headers.get('set-cookie');
    console.log('Response cookie:', setCookieHeader);

    // Create the response with the success message
    const html = `
      <html>
        <body>
          <script>
            window.opener.postMessage(
              {
                type: 'SUCCESS',
                data: ${JSON.stringify(data)}
              },
              window.location.origin
            );
            window.close();
          </script>
        </body>
      </html>
    `;

    // Create response with cookies
    const headers = new Headers({
      'Content-Type': 'text/html',
    });

    // Clear the state cookie
    headers.append('Set-Cookie', 'discord_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

    // Forward the session cookie from the API response
    if (setCookieHeader) {
      headers.append('Set-Cookie', setCookieHeader);
    }

    return new Response(html, { headers });
  } catch (error) {
    console.error('Discord callback error:', error);
    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage(
              {
                type: 'ERROR',
                data: { message: 'Authentication failed' }
              },
              window.location.origin
            );
            window.close();
          </script>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
