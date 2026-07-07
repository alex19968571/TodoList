import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  settings = this.settingsSvc.settings;

  themes    = ['system', 'light', 'dark'];
  fontSizes = ['sm', 'md', 'lg'];
  languages = [{ value: 'zh-TW', label: '繁體中文' }, { value: 'en-US', label: 'English' }];

  constructor(
    public settingsSvc: SettingsService,
    public auth: AuthService,
    private translate: TranslateService
  ) {}

  changeLanguage(lang: string) {
    this.settingsSvc.update({ language: lang });
    this.translate.use(lang);
  }

  changeTheme(theme: string) { this.settingsSvc.update({ theme }); }
  changeFontSize(fontSize: string) { this.settingsSvc.update({ fontSize }); }
  changeAccentColor(accentColor: string) { this.settingsSvc.update({ accentColor }); }
}
