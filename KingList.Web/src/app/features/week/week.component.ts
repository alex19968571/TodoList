import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../core/services/user.service';
import { SettingsService } from '../../core/services/settings.service';

interface WeekDay { date: string; label: string; weekLabel: string; dayNum: number; monthNum: number; isToday: boolean; }

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
  selector: 'app-week',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './week.component.html'
})
export class WeekComponent {
  weekOffset = signal(0);
  selDate    = signal(this.todayStr());

  private todayStr() { return new Date().toISOString().substring(0, 10); }

  readonly weekDays = computed<WeekDay[]>(() => {
    const isZH = this.settings.language() === 'zh-TW';
    const labels = isZH ? ['一','二','三','四','五','六','日'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const base = new Date(); base.setDate(base.getDate() + this.weekOffset() * 7);
    const mon  = this.getWeekStart(base);
    const today = this.todayStr();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon.getTime() + i * 86400000);
      const ds = d.toISOString().substring(0, 10);
      return {
        date: ds, label: labels[i],
        weekLabel: isZH ? '週' + labels[i] : labels[i],
        dayNum: d.getDate(), monthNum: d.getMonth() + 1,
        isToday: ds === today
      };
    });
  });

  readonly monthLabel = computed(() => {
    const days = this.weekDays();
    if (!days.length) return '';
    const { date: fd } = days[0], { date: ld } = days[6];
    const fy = +fd.substring(0,4), fm = +fd.substring(5,7);
    const ly = +ld.substring(0,4), lm = +ld.substring(5,7);
    if (this.settings.language() === 'zh-TW') {
      if (fy === ly && fm === lm) return `${fy}年${fm}月`;
      if (fy === ly) return `${fy}年 ${fm}月 – ${lm}月`;
      return `${fy}年${fm}月 – ${ly}年${lm}月`;
    }
    if (fy === ly && fm === lm) return `${MONTHS_SHORT[fm-1]} ${fy}`;
    if (fy === ly) return `${MONTHS_SHORT[fm-1]} – ${MONTHS_SHORT[lm-1]} ${fy}`;
    return `${MONTHS_SHORT[fm-1]} ${fy} – ${MONTHS_SHORT[lm-1]} ${ly}`;
  });

  readonly selDayTasks = computed(() => {
    const ds = this.selDate();
    return this.userSvc.tasks().filter(t => {
      if (t.isOverdue || t.completed) return false;
      const from = t.startTime ? t.startTime.substring(0,10) : (t.date || ds);
      const to   = t.deadline  ? t.deadline.substring(0,10)  : from;
      return ds >= from && ds <= to;
    });
  });

  constructor(public userSvc: UserService, private settings: SettingsService) {}

  formatDate(day: WeekDay): string {
    if (this.settings.language() === 'zh-TW') return `${day.monthNum}月${day.dayNum}日`;
    return `${MONTHS_SHORT[day.monthNum - 1]} ${day.dayNum}`;
  }

  prevWeek() { this.weekOffset.update(v => v - 1); }
  nextWeek() { this.weekOffset.update(v => v + 1); }
  goToday()  { this.weekOffset.set(0); this.selDate.set(this.todayStr()); }
  select(date: string) { this.selDate.set(date); }

  private getWeekStart(d: Date): Date {
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  }
}
