export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateState(returnedState: string | null, storedState: string | null | undefined): boolean {
  if (!returnedState || !storedState) {
      return false;
  }
  return returnedState === storedState;
}