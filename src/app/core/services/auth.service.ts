import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, LoginRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'http://localhost:8000/api/v1/auth';
  private readonly TOKEN_KEY = 'it_access_token';
  private readonly USER_KEY = 'it_user_data';

  // State Signals
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());
  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.rol === 'ADMIN');

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        this.saveSession(response.access_token, response.user);
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
      })
    );
  }

  getToken(): string | null {
    return this.token();
  }

  private saveSession(token: string, user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.token.set(token);
    this.currentUser.set(user);
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
