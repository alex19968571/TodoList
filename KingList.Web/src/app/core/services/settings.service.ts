import { Injectable, signal } from '@angular/core';
import { UserSettings } from './user.service';

const STORAGE_KEY = 'kl_settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private _settings = signal<UserSettings>(this.load());

  settings = this._settings.asReadonly();

  language = () => this._settings().language;
  theme    = () => this._settings().theme;

  update(partial: Partial<UserSettings>): void {
    this._settings.update(s => ({ ...s, ...partial }));
    this.save();
    if (partial.theme) this.applyTheme();
    if (partial.language) {
      document.documentElement.lang = partial.language === 'zh-TW' ? 'zh-TW' : 'en';
    }
    if (partial.accentColor) {
      document.documentElement.style.setProperty('--accent', partial.accentColor);
    }
  }

  applyTheme(): void {
    const theme = this._settings().theme;
    const isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (this._settings().accentColor) {
      document.documentElement.style.setProperty('--accent', this._settings().accentColor);
    }
  }

  private load(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : this.defaults();
    } catch { return this.defaults(); }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings()));
  }

  private detectSystemLanguage(): string {
    const lang = (navigator.language ?? '').toLowerCase();
    return lang.startsWith('zh') ? 'zh-TW' : 'en-US';
  }

  private defaults(): UserSettings {
    return {
      theme: 'system', language: this.detectSystemLanguage(), fontSize: 'md',
      accentColor: '#667eea', todayBg: '', calBg: '', dateBgs: {}, notifEnabled: true
    };
  }
}
