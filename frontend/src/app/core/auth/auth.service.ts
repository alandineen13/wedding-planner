import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, LoginCredentials, AuthResponse } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'wp_token';
const USER_KEY  = 'wp_user';
const API       = `${environment.apiUrl}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private _user  = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(this.loadToken());

  readonly user            = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  login(credentials: LoginCredentials): Promise<AuthResponse> {
    return firstValueFrom(
      this.http.post<AuthResponse>(`${API}/login`, credentials).pipe(
        tap(r => this.setSession(r))
      )
    );
  }

  register(data: { email: string; password: string; name: string }): Promise<AuthResponse> {
    return firstValueFrom(
      this.http.post<AuthResponse>(`${API}/register`, data).pipe(
        tap(r => this.setSession(r))
      )
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Full page reload clears all singleton service state (signals, cached data).
    window.location.href = '/';
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
