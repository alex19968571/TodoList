import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { TaskItem } from '../../models/task.model';
import { Group } from '../../models/group.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GroupService {
  readonly activeGroup  = signal<Group | null>(null);
  readonly groupTasks   = signal<TaskItem[]>([]);
  readonly groupTrash   = signal<TaskItem[]>([]);

  private hub: HubConnection | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async activateGroup(groupId: string): Promise<void> {
    // Load group info
    this.http.get<Group>(`/api/groups/${groupId}`).subscribe(g => this.activeGroup.set(g));

    // Connect SignalR for real-time tasks
    await this.connectSignalR(groupId);
  }

  private async connectSignalR(groupId: string): Promise<void> {
    if (this.hub) await this.hub.stop();

    this.hub = new HubConnectionBuilder()
      .withUrl('/hubs/group')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.hub.on('TasksChanged', (tasks: TaskItem[]) => {
      this.groupTasks.set(tasks);
    });

    await this.hub.start();
    const token = this.auth.idToken();
    await this.hub.invoke('JoinGroup', groupId, token);
  }

  leaveGroup(groupId: string): void {
    this.http.delete(`/api/groups/${groupId}/members/me`).subscribe();
    this.hub?.invoke('LeaveGroup', groupId);
    this.activeGroup.set(null);
    this.groupTasks.set([]);
  }

  createGroup(name: string) {
    return this.http.post<{ groupId: string; inviteCode: string }>('/api/groups', { name });
  }

  joinGroup(inviteCode: string) {
    return this.http.post<{ groupId: string }>('/api/groups/join', { inviteCode });
  }

  addTask(groupId: string, task: Partial<TaskItem>) {
    return this.http.post<TaskItem>(`/api/groups/${groupId}/tasks`, task);
  }

  updateTask(groupId: string, taskId: string, task: Partial<TaskItem>) {
    return this.http.put(`/api/groups/${groupId}/tasks/${taskId}`, task);
  }

  deleteTask(groupId: string, taskId: string) {
    return this.http.delete(`/api/groups/${groupId}/tasks/${taskId}`);
  }
}
