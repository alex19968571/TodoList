import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent implements OnInit {
  constructor(
    private translate: TranslateService,
    private settings: SettingsService
  ) {}

  ngOnInit() {
    const lang = this.settings.language();
    this.translate.use(lang);
    document.documentElement.lang = lang === 'zh-TW' ? 'zh-TW' : 'en';
    this.settings.applyTheme();
  }
}
