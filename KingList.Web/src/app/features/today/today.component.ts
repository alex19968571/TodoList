import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../core/services/user.service';
import { TaskItem, TrashItem } from '../../models/task.model';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './today.component.html'
})
export class TodayComponent implements OnInit {
  readonly tasks    = this.userSvc.tasks;
  readonly trash    = this.userSvc.trash;

  isAdding  = false;
  editId: string | null = null;

  form = this.emptyForm();

  readonly today = new Date().toISOString().substring(0, 10);

  readonly todayTasks = computed(() =>
    this.tasks().filter(t => {
      if (t.completed || t.isOverdue) return false;
      const from = t.startTime ? t.startTime.substring(0, 10) : (t.date || this.today);
      const to   = t.deadline  ? t.deadline.substring(0, 10)  : from;
      return this.today >= from && this.today <= to;
    })
  );

  readonly overdue = computed(() =>
    this.tasks().filter(t => t.isOverdue && !t.completed)
  );

  readonly trashVisible = signal(false);

  constructor(public userSvc: UserService, private toastr: ToastrService) {}

  ngOnInit() {}

  emptyForm(): Partial<TaskItem> {
    return { text: '', description: '', date: this.today, priority: '4', tags: [], steps: [] };
  }

  startAdd() { this.form = this.emptyForm(); this.editId = null; this.isAdding = true; }

  cancelForm() { this.isAdding = false; this.editId = null; }

  saveTask() {
    if (!(this.form.text ?? '').trim()) return;
    const tasks = [...this.tasks()];
    if (this.editId) {
      const idx = tasks.findIndex(t => t.id === this.editId);
      if (idx >= 0) tasks[idx] = { ...tasks[idx], ...this.form } as TaskItem;
    } else {
      tasks.push({ ...this.form, id: Date.now().toString(), completed: false, isOverdue: false } as TaskItem);
    }
    this.userSvc.saveTasks(tasks);
    this.cancelForm();
  }

  editTask(task: TaskItem) {
    this.form = { ...task };
    this.editId = task.id;
    this.isAdding = true;
  }

  toggleTask(id: string) {
    const tasks = this.tasks().map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    this.userSvc.saveTasks(tasks);
  }

  deleteTask(id: string) {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;
    const trash: TrashItem[] = [{ ...task, deletedAt: new Date().toISOString() }, ...this.trash() as TrashItem[]];
    this.userSvc.saveTasks(this.tasks().filter(t => t.id !== id));
    this.userSvc.saveTrash(trash);
  }

  restoreTask(id: string) {
    const item = (this.trash() as TrashItem[]).find(t => t.id === id);
    if (!item) return;
    const { deletedAt, ...task } = item;
    this.userSvc.saveTasks([...this.tasks(), task as TaskItem]);
    this.userSvc.saveTrash(this.trash().filter(t => t.id !== id));
  }

  permanentDelete(id: string) {
    this.userSvc.saveTrash(this.trash().filter(t => t.id !== id));
  }

  getPrioColor(p: string): string {
    return { '1': '#fc8181', '2': '#f6ad55', '3': '#63b3ed', '4': '#a0aec0' }[p] ?? '#a0aec0';
  }
}
