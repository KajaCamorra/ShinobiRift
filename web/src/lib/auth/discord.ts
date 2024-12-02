import { PlayFabClient } from 'playfab-sdk';

const DEBUG = true;

// Initialize PlayFab with title ID
if (process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID) {
  PlayFabClient.settings.titleId = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID;
  if (DEBUG) console.log('[PlayFab Auth] Initialized with title ID:', process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID);
}

export interface DiscordUser {
  id: string;
  username: string;
  email: string;
  global_name?: string;
}

export async function handleDiscordLogin(accessToken: string): Promise<any> {
  try {
    if (DEBUG) console.log('[PlayFab Auth] Starting Discord login...');

    // Verify PlayFab is initialized
    if (!PlayFabClient.settings.titleId) {
      throw new Error('PlayFab title ID not configured');
    }

    // Get Discord user info
    if (DEBUG) console.log('[PlayFab Auth] Getting Discord user info...');
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      if (DEBUG) console.error('[PlayFab Auth] Failed to get Discord user info:', errorText);
      throw new Error('Failed to get Discord user info');
    }

    const userData: DiscordUser = await userResponse.json();
    if (DEBUG) console.log('[PlayFab Auth] Discord user data:', userData);

    // Login with PlayFab using Discord ID
    if (DEBUG) console.log('[PlayFab Auth] Logging in with PlayFab...');
    return new Promise((resolve, reject) => {
      PlayFabClient.LoginWithCustomID({
        CustomId: `discord_${userData.id}`,
        CreateAccount: true,
        InfoRequestParameters: {
          GetUserAccountInfo: true,
          GetUserInventory: false,
          GetUserVirtualCurrency: false,
          GetUserData: false,
          GetPlayerStatistics: false,
          GetPlayerProfile: true,
          GetTitleData: false,
          GetUserReadOnlyData: false,
          GetCharacterList: false,
          GetCharacterInventories: false
        }
      }, (error: any, result: any) => {
        if (error) {
          console.error('[PlayFab Auth] Login error:', error);
          reject(error);
          return;
        }

        if (DEBUG) console.log('[PlayFab Auth] Login result:', result);

        // Update display name if new account
        if (result.data.NewlyCreated) {
          if (DEBUG) console.log('[PlayFab Auth] New account, updating display name...');
          PlayFabClient.UpdateUserTitleDisplayName({
            DisplayName: userData.global_name || userData.username
          }, (updateError) => {
            if (updateError) {
              console.warn('[PlayFab Auth] Failed to update display name:', updateError);
            }
            if (DEBUG) console.log('[PlayFab Auth] Login complete with new account');
            resolve({ ...result, discordId: userData.id });
          });
        } else {
          if (DEBUG) console.log('[PlayFab Auth] Login complete with existing account');
          resolve({ ...result, discordId: userData.id });
        }
      });
    });
  } catch (error) {
    console.error('[PlayFab Auth] Login error:', error);
    throw error;
  }
}
