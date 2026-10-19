export const useAuthToken = () =>
  useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    default: () => null,
  })
