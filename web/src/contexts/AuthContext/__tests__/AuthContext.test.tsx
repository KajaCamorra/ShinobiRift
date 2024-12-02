import { render, screen, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { PlayFabClient } from 'playfab-sdk';
import { AuthProvider, useAuth } from '../index';
import type { LoginResult } from '../types';

// Mock ToastContext
jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

// Test component that uses the auth context
function TestComponent(): JSX.Element {
  const { user, login, logout, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {user ? (
        <>
          <div data-testid="user-display">{user.displayName}</div>
          <button type="button" onClick={() => logout()}>
            Logout
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() =>
            login({
              code: 200,
              status: 'OK',
              data: {
                SessionTicket: 'test-ticket',
                PlayFabId: 'test-id',
                NewlyCreated: false,
                InfoResultPayload: {
                  PlayerProfile: {
                    DisplayName: 'Test User',
                  },
                },
              },
              discordId: 'test-discord-id'
            } as LoginResult)
          }
        >
          Login
        </button>
      )}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('provides initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockRouter = useRouter();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-display')).toHaveTextContent('Test User');
      expect(localStorage.setItem).toHaveBeenCalledWith('playfab_session', 'test-ticket');
      expect(localStorage.setItem).toHaveBeenCalledWith('discord_id', 'test-discord-id');
      expect(mockRouter.push).toHaveBeenCalledWith('/game');
    });
  });

  it('handles logout', async () => {
    const mockRouter = useRouter();
    
    localStorage.setItem('playfab_session', 'test-ticket');
    localStorage.setItem('discord_id', 'test-discord-id');
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('playfab_session');
      expect(localStorage.removeItem).toHaveBeenCalledWith('discord_id');
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('handles session check on mount', async () => {
    (PlayFabClient.GetPlayerProfile as jest.Mock).mockImplementation(
      (_: unknown, callback: (error: Error | null, result: unknown) => void) => {
        callback(null, {
          data: {
            PlayerProfile: {
              PlayerId: 'test-id',
              DisplayName: 'Test User',
            },
          },
        });
      }
    );

    localStorage.setItem('playfab_session', 'test-ticket');
    localStorage.setItem('discord_id', 'test-discord-id');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-display')).toHaveTextContent('Test User');
    });
  });

  it('handles failed session check', async () => {
    (PlayFabClient.GetPlayerProfile as jest.Mock).mockImplementation(
      (_: unknown, callback: (error: Error | null, result: unknown) => void) => {
        callback(new Error('Session invalid'), null);
      }
    );

    localStorage.setItem('playfab_session', 'invalid-ticket');
    localStorage.setItem('discord_id', 'test-discord-id');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('playfab_session');
      expect(localStorage.removeItem).toHaveBeenCalledWith('discord_id');
      expect(screen.queryByTestId('user-display')).not.toBeInTheDocument();
    });
  });
});
