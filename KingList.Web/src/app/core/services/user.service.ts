import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TaskItem } from '../../models/task.model';

export interface UserSettings {
  theme: string;
  language: string;
  fontSize: string;
  accentColor: string;
  todayBg: string;
  calBg: string;
  dateBgs: Record<string, string>;
  notifEnabled: boolean;
  avatarUrl?: string;
}

export interface UserData {
  tasks: TaskItem[];
  settings: UserSettings;
  trash: TaskItem[];
  groupTrash: TaskItem[];
  groups: string[];
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly tasks  = signal<TaskItem[]>([]);
  readonly trash  = signal<TaskItem[]>([]);
  readonly groups = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  load(): void {
    this.http.get<UserData>('/api/users/me').subscribe(data => {
      this.tasks.set(data.tasks ?? []);
      this.trash.set(data.trash ?? []);
      this.groups.set(data.groups ?? []);
    });
  }

  saveTasks(tasks: TaskItem[]): void {
    this.tasks.set(tasks);
    this.http.put('/api/tasks', tasks).subscribe();
  }

  saveTrash(trash: TaskItem[]): void {
    this.trash.set(trash);
    this.http.put('/api/tasks/trash', trash).subscribe();
  }
}
