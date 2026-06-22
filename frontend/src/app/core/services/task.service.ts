import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Task, TaskStatus } from '../../shared/models/task.model';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/tasks`;

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private _tasks = signal<Task[]>([]);

  readonly tasks = this._tasks.asReadonly();

  readonly stats = computed(() => {
    const t = this._tasks();
    const now = new Date();
    return {
      total: t.length,
      completed: t.filter(x => x.status === 'completed').length,
      inProgress: t.filter(x => x.status === 'in_progress').length,
      todo: t.filter(x => x.status === 'todo').length,
      overdue: t.filter(x => x.status !== 'completed' && !!x.dueDate && new Date(x.dueDate) < now).length,
    };
  });

  constructor() { this.load(); }

  private load(): void {
    this.http.get<Task[]>(API).subscribe(tasks => this._tasks.set(tasks));
  }

  add(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Observable<Task> {
    return this.http.post<Task>(API, task).pipe(
      tap(t => this._tasks.update(list => [...list, t]))
    );
  }

  update(id: string, changes: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${API}/${id}`, changes).pipe(
      tap(t => this._tasks.update(list => list.map(x => x.id === id ? t : x)))
    );
  }

  updateStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.update(id, { status });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`).pipe(
      tap(() => this._tasks.update(list => list.filter(t => t.id !== id)))
    );
  }
}
