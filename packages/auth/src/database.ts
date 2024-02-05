// type Ensure<T, K extends keyof any> = Omit<T, K> & Required<Pick<T, K>>;

export interface KeyBase {
  id: unknown;
  userId: unknown;
  providerUserId: unknown;
  provider: unknown;
  hashedPassword?: unknown;
}

export interface UserBase {
  id: unknown;
}

export interface SessionBase {
  id?: unknown;
  token: unknown;
  activeExpires: unknown;
  idleExpires: unknown;
  userId: unknown;
}
