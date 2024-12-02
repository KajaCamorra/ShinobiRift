import '@testing-library/jest-dom';
import { PlayFabClient } from 'playfab-sdk';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
    }
  }

  interface Window {
    PlayFabClientSDK: typeof PlayFabClient;
  }
}

// Extend PlayFabClient for mocking
declare module 'playfab-sdk' {
  interface PlayFabClient {
    IsClientLoggedIn: () => boolean;
    settings: {
      titleId: string;
    };
    GetPlayerProfile: (
      request: any,
      callback: (error: Error | null, result: any) => void
    ) => void;
  }
}
