import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TaskService } from '../../core/services/task.service';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../shared/models/task.model';

interface TaskFormData {
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  description: string;
  notes: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule, DatePipe, TitleCasePipe, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatTooltipModule, MatProgressBarModule, MatDividerModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class TasksComponent {
  private taskSvc = inject(TaskService);
  private snackBar = inject(MatSnackBar);

  readonly tasks = this.taskSvc.tasks;
  readonly stats = this.taskSvc.stats;

  statusFilter = signal<TaskStatus | ''>('');
  priorityFilter = signal<TaskPriority | ''>('');
  searchQuery = signal('');
  showForm = signal(false);
  editingId = signal<string | null>(null);

  formData: TaskFormData = {
    title: '',
    category: 'other',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    description: '',
    notes: '',
  };

  readonly filteredTasks = computed(() => {
    let tasks = this.tasks();
    const q = this.searchQuery().toLowerCase();
    if (q) tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    if (this.statusFilter()) tasks = tasks.filter(t => t.status === this.statusFilter());
    if (this.priorityFilter()) tasks = tasks.filter(t => t.priority === this.priorityFilter());
    return tasks.sort((a, b) => {
      const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] ?? 99) - (order[b.priority] ?? 99);
    });
  });

  readonly taskProgress = computed(() => {
    const s = this.stats();
    return s.total ? Math.round((s.completed / s.total) * 100) : 0;
  });

  readonly categories: TaskCategory[] = ['venue', 'catering', 'invitations', 'attire', 'photography', 'entertainment', 'flowers', 'transport', 'accommodation', 'legal', 'budget', 'other'];

  toggleForm(): void {
    this.showForm.set(!this.showForm());
  }

  saveTask(): void {
    if (!this.formData.title) return;
    const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: this.formData.title,
      category: this.formData.category,
      status: this.formData.status,
      priority: this.formData.priority,
      dueDate: this.formData.dueDate || undefined,
      description: this.formData.description || undefined,
      notes: this.formData.notes || undefined,
    };
    if (this.editingId()) {
      this.taskSvc.update(this.editingId()!, task).subscribe({
        next: () => { this.snackBar.open('Task updated', 'Close', { duration: 2000 }); this.resetForm(); },
        error: () => this.snackBar.open('Failed to save task', 'Close', { duration: 2000 }),
      });
    } else {
      this.taskSvc.add(task).subscribe({
        next: () => { this.snackBar.open('Task added', 'Close', { duration: 2000 }); this.resetForm(); },
        error: () => this.snackBar.open('Failed to add task', 'Close', { duration: 2000 }),
      });
    }
  }

  editTask(task: Task): void {
    this.editingId.set(task.id);
    this.formData = {
      title: task.title,
      category: task.category,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      description: task.description ?? '',
      notes: task.notes ?? '',
    };
    this.showForm.set(true);
  }

  deleteTask(id: string): void {
    if (confirm('Delete this task?')) {
      this.taskSvc.delete(id).subscribe({
        error: () => this.snackBar.open('Failed to delete task', 'Close', { duration: 2000 }),
      });
    }
  }

  toggleStatus(task: Task): void {
    const next: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    this.taskSvc.updateStatus(task.id, next).subscribe();
  }

  resetForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formData = { title: '', category: 'other', status: 'todo', priority: 'medium', dueDate: '', description: '', notes: '' };
  }

  isOverdue(task: Task): boolean {
    return task.status !== 'completed' && !!task.dueDate && new Date(task.dueDate) < new Date();
  }

  getPriorityClass(priority: TaskPriority): string {
    return `priority-${priority}`;
  }

  getStatusIcon(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      completed: 'check_circle', in_progress: 'pending', todo: 'radio_button_unchecked', cancelled: 'cancel',
    };
    return map[status];
  }
}
