export interface User {
  id: string;
  email: string;
  name: string;
  weddingDate?: string;
  partnerName?: string;
  venueName?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
