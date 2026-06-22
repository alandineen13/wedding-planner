import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, LoginCredentials, AuthResponse } from '../../shared/models/user.model';

const MOCK_USER: User = {
  id: '1',
  email: 'couple@wedding.com',
  name: 'Laura & Alan',
  weddingDate: '2026-09-04',
  partnerName: 'Alan Dineen',
  venueName: 'Hotel and Gardens',
};

const TOKEN_KEY = 'wp_token';
const USER_KEY = 'wp_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(this.loadToken());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  constructor(private router: Router) {}

  login(credentials: LoginCredentials): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (
          credentials.email === 'couple@wedding.com' &&
          credentials.password === 'wedding2025'
        ) {
          const token = 'mock-jwt-token-' + Date.now();
          const response: AuthResponse = { token, user: MOCK_USER };
          this.setSession(response);
          resolve(response);
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 600);
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this._token();
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this._token.set(response.token);
    this._user.set(response.user);
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
