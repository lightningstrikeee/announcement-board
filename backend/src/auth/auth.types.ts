export type JwtUserPayload = {
  sub: string;
  email: string;
  displayName: string;
  name: string;
  surname: string;
  role: 'user' | 'admin';
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  name: string;
  surname: string;
  role: 'user' | 'admin';
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};
