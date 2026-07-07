import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../core/services/user.service';
import { SettingsService } from '../../core/services/settings.service';

interface CalCell { date: string; dayNum: number; inMonth: boolean; isToday: boolean; taskCount: number; }

const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './calendar.component.html'
})
export class CalendarComponent {
  calMonth = signal(new Date());
  today = new Date().toISOString().substring(0, 10);

  readonly monthLabel = computed(() => {
    const d = this.calMonth();
    const months = this.settings.language() === 'zh-TW' ? MONTHS_ZH : MONTHS_EN;
    return this.settings.language() === 'zh-TW'
      ? `${d.getFullYear()}年 ${months[d.getMonth()]}`
      : `${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  readonly weekHeaders = computed(() =>
    this.settings.language() === 'zh-TW'
      ? ['日','一','二','三','四','五','六']
      : ['Su','Mo','Tu','We','Th','Fr','Sa']
  );

  readonly cells = computed<CalCell[]>(() => {
    const d = this.calMonth();
    const year = d.getFullYear(), month = d.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const cells: CalCell[] = [];
    const tasks = this.userSvc.tasks();

    // Pad before
    for (let i = 0; i < first.getDay(); i++) {
      const dt = new Date(year, month, 1 - (first.getDay() - i));
      cells.push({ date: dt.toISOString().substring(0,10), dayNum: dt.getDate(), inMonth: false, isToday: false, taskCount: 0 });
    }
    for (let i = 1; i <= last.getDate(); i++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const count = tasks.filter(t => (t.date || t.startTime?.substring(0,10)) === ds).length;
      cells.push({ date: ds, dayNum: i, inMonth: true, isToday: ds === this.today, taskCount: count });
    }
    // Pad after
    const rem = 42 - cells.length;
    for (let i = 1; i <= rem; i++) {
      const dt = new Date(year, month + 1, i);
      cells.push({ date: dt.toISOString().substring(0,10), dayNum: i, inMonth: false, isToday: false, taskCount: 0 });
    }
    return cells;
  });

  constructor(public userSvc: UserService, private settings: SettingsService) {}

  prevMonth() { this.calMonth.update(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  nextMonth() { this.calMonth.update(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }
  goToday()   { this.calMonth.set(new Date()); }
}
