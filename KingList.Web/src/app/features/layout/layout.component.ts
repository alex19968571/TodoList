import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, CommonModule],
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit {
  constructor(
    public auth: AuthService,
    public userSvc: UserService,
    private settings: SettingsService,
    private translate: TranslateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userSvc.load();
  }

  goHome() { this.router.navigate(['/today']); }

  logout() { this.auth.signOut(); }
}
