export function validateState(returnedState: string | null, storedState: string | null): boolean {
  if (!returnedState || !storedState) {
    return false;
  }
  return returnedState === storedState;
}
