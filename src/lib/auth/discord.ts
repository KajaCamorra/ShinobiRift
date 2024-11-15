// src/lib/auth/discord.ts
import { PlayFabClient } from 'playfab-sdk';

// Initialize PlayFab with title ID
if (process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID) {
  PlayFabClient.settings.titleId = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID;
}

export interface DiscordUser {
  id: string;
  username: string;
  email: string;
}

export async function handleDiscordLogin(accessToken: string): Promise<any> {
  try {
    // Verify PlayFab is initialized
    if (!PlayFabClient.settings.titleId) {
      throw new Error('PlayFab title ID not configured');
    }

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get Discord user info');
    }

    const userData: DiscordUser = await userResponse.json();
    console.log('Discord user data:', userData);

    // Login with PlayFab using Discord ID
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
          console.error('PlayFab login error:', error);
          reject(error);
          return;
        }

        console.log('PlayFab login result:', result);

        // Update display name if new account
        if (result.data.NewlyCreated) {
          PlayFabClient.UpdateUserTitleDisplayName({
            DisplayName: userData.username
          }, (updateError) => {
            if (updateError) {
              console.warn('Failed to update display name:', updateError);
            }
            resolve(result);
          });
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error('handleDiscordLogin error:', error);
    throw error;
  }
}