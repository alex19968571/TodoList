import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);

  readonly currentUser = signal<User | null>(null);
  readonly idToken = signal<string>('');

  constructor(private router: Router) {
    onAuthStateChanged(this.auth, async user => {
      this.currentUser.set(user);
      if (user) {
        const token = await user.getIdToken();
        this.idToken.set(token);
      } else {
        this.idToken.set('');
      }
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
    this.router.navigate(['/']);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  /** Refresh token (called before API requests if needed) */
  async refreshToken(): Promise<string> {
    const user = this.currentUser();
    if (!user) return '';
    const token = await user.getIdToken(true);
    this.idToken.set(token);
    return token;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}
