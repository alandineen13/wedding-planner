import { Injectable, signal, computed } from '@angular/core';
import { Task, TaskStatus } from '../../shared/models/task.model';

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Book venue', category: 'venue', status: 'completed', priority: 'urgent', dueDate: '2024-12-01', completedAt: '2024-11-20', createdAt: '2024-10-01', updatedAt: '2024-11-20' },
  { id: '2', title: 'Send save the dates', category: 'invitations', status: 'completed', priority: 'high', dueDate: '2025-01-15', completedAt: '2025-01-10', createdAt: '2024-10-01', updatedAt: '2025-01-10' },
  { id: '3', title: 'Confirm guest list', category: 'invitations', status: 'in_progress', priority: 'high', dueDate: '2025-02-01', createdAt: '2024-10-01', updatedAt: '2025-01-01' },
  { id: '4', title: 'Choose wedding cake design', category: 'other', status: 'todo', priority: 'medium', dueDate: '2025-03-01', createdAt: '2024-10-01', updatedAt: '2024-10-01' },
  { id: '5', title: 'Book photographer second meeting', category: 'photography', status: 'todo', priority: 'medium', dueDate: '2025-02-15', createdAt: '2025-01-05', updatedAt: '2025-01-05' },
  { id: '6', title: 'Arrange transport for wedding party', category: 'transport', status: 'todo', priority: 'high', dueDate: '2025-04-01', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '7', title: 'Send formal invitations', category: 'invitations', status: 'todo', priority: 'urgent', dueDate: '2025-03-15', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '8', title: 'Finalise seating plan', category: 'other', status: 'todo', priority: 'high', dueDate: '2025-08-01', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '9', title: 'Buy wedding rings', category: 'legal', status: 'in_progress', priority: 'urgent', dueDate: '2025-04-01', createdAt: '2025-01-01', updatedAt: '2025-01-10' },
  { id: '10', title: 'Book honeymoon flights', category: 'accommodation', status: 'todo', priority: 'medium', dueDate: '2025-05-01', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

@Injectable({ providedIn: 'root' })
export class TaskService {
  private _tasks = signal<Task[]>(MOCK_TASKS);
  readonly tasks = this._tasks.asReadonly();

  readonly stats = computed(() => {
    const t = this._tasks();
    return {
      total: t.length,
      completed: t.filter(x => x.status === 'completed').length,
      inProgress: t.filter(x => x.status === 'in_progress').length,
      todo: t.filter(x => x.status === 'todo').length,
      overdue: t.filter(x => x.status !== 'completed' && x.dueDate && new Date(x.dueDate) < new Date()).length,
    };
  });

  add(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const now = new Date().toISOString();
    const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    this._tasks.update(list => [...list, newTask]);
    return newTask;
  }

  update(id: string, changes: Partial<Task>): void {
    this._tasks.update(list =>
      list.map(t => t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t)
    );
  }

  updateStatus(id: string, status: TaskStatus): void {
    const changes: Partial<Task> = { status };
    if (status === 'completed') changes.completedAt = new Date().toISOString();
    this.update(id, changes);
  }

  delete(id: string): void {
    this._tasks.update(list => list.filter(t => t.id !== id));
  }
}
