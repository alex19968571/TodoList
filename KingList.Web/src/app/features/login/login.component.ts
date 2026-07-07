import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="login-wrap d-flex align-items-center justify-content-center min-vh-100">
      <div class="text-center p-5 card-section" style="max-width:360px;width:100%">
        <img src="logo.png" style="width:72px;height:72px;margin-bottom:16px;"
             alt="KingList" onerror="this.style.display='none'">
        <h3 class="fw-bold mb-1">KingList</h3>
        <p class="text-muted mb-4">{{ 'loginSubtitle' | translate }}</p>
        <button class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                (click)="signIn()">
          <i class="bi bi-google"></i> {{ 'loginGoogle' | translate }}
        </button>
      </div>
    </div>
  `
})
export class LoginComponent {
  constructor(private auth: AuthService) {}
  signIn() { this.auth.signInWithGoogle(); }
}
