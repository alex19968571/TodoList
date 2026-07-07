export interface TaskStep {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskItem {
  id: string;
  text: string;
  description: string;
  date: string;                 // YYYY-MM-DD
  startTime?: string;           // YYYY-MM-DDTHH:mm
  deadline?: string;            // YYYY-MM-DDTHH:mm
  priority: '1' | '2' | '3' | '4';
  tags: string[];
  steps: TaskStep[];
  location: string;
  reminderType: string;
  customReminderTime?: string;
  calculatedReminder?: string;
  completed: boolean;
  isOverdue: boolean;
  // group extras
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
  _groupId?: string;
}

export interface TrashItem extends TaskItem {
  deletedAt: string;
}
