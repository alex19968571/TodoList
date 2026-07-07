import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { GroupService } from '../../core/services/group.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-group-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './group-tasks.component.html'
})
export class GroupTasksComponent implements OnInit {
  activeGroup  = this.groupSvc.activeGroup;
  groupTasks   = this.groupSvc.groupTasks;
  userGroups   = this.userSvc.groups;

  newGroupName = '';
  joinCode     = '';
  isAdding     = false;
  newTaskText  = '';
  error        = '';

  constructor(public groupSvc: GroupService, public userSvc: UserService) {}

  ngOnInit() {
    const groups = this.userGroups();
    if (groups.length) this.groupSvc.activateGroup(groups[groups.length - 1]);
  }

  createGroup() {
    if (!this.newGroupName.trim()) return;
    this.groupSvc.createGroup(this.newGroupName.trim()).subscribe(res => {
      this.userSvc.groups.update(g => [...g, res.groupId]);
      this.groupSvc.activateGroup(res.groupId);
      this.newGroupName = '';
    });
  }

  joinGroup() {
    if (!this.joinCode.trim()) return;
    this.groupSvc.joinGroup(this.joinCode.trim()).subscribe({
      next: res => {
        this.userSvc.groups.update(g => [...g, res.groupId]);
        this.groupSvc.activateGroup(res.groupId);
        this.joinCode = '';
      },
      error: () => this.error = '邀請碼不存在'
    });
  }

  addTask() {
    const g = this.activeGroup();
    if (!this.newTaskText.trim() || !g) return;
    this.groupSvc.addTask(g.id, {
      text: this.newTaskText, date: new Date().toISOString().substring(0,10),
      priority: '4', tags: [], steps: [], completed: false, isOverdue: false
    } as any).subscribe(() => this.newTaskText = '');
  }

  leaveGroup() {
    const g = this.activeGroup();
    if (g) this.groupSvc.leaveGroup(g.id);
  }
}
