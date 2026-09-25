// Email links can return to a conversation after login, never to another origin.
export function afterLoginPath(value: string | null): string {
  return value && /^\/chat\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value)
    ? value : '/cabinet';
}
