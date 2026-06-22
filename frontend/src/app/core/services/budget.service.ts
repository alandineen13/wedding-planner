import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { BudgetItem, BudgetSummary } from '../../shared/models/budget.model';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/budget`;

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private _items = signal<BudgetItem[]>([]);
  readonly totalBudget = signal<number>(0);

  readonly items = this._items.asReadonly();

  readonly summary = computed((): BudgetSummary => {
    const items = this._items();
    const totalEstimated = items.reduce((s, i) => s + i.estimatedCost, 0);
    const totalActual    = items.reduce((s, i) => s + (i.actualCost ?? 0), 0);
    const totalPaid      = items
      .filter(i => i.paymentStatus === 'paid')
      .reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0);
    return {
      totalBudget: this.totalBudget(),
      totalEstimated,
      totalActual,
      totalPaid,
      totalOutstanding: totalActual - totalPaid,
      variance: this.totalBudget() - totalActual,
    };
  });

  constructor() { this.load(); }

  private load(): void {
    this.http.get<{ totalBudget: number; items: BudgetItem[] }>(API).subscribe(res => {
      this._items.set(res.items);
      this.totalBudget.set(res.totalBudget);
    });
  }

  setTotalBudget(amount: number): Observable<{ totalBudget: number }> {
    return this.http.put<{ totalBudget: number }>(`${API}/settings`, { totalBudget: amount }).pipe(
      tap(res => this.totalBudget.set(res.totalBudget))
    );
  }

  add(item: Omit<BudgetItem, 'id' | 'createdAt'>): Observable<BudgetItem> {
    return this.http.post<BudgetItem>(API, item).pipe(
      tap(created => this._items.update(list => [...list, created]))
    );
  }

  update(id: string, changes: Partial<BudgetItem>): Observable<BudgetItem> {
    return this.http.put<BudgetItem>(`${API}/${id}`, changes).pipe(
      tap(item => this._items.update(list => list.map(i => i.id === id ? item : i)))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`).pipe(
      tap(() => this._items.update(list => list.filter(i => i.id !== id)))
    );
  }
}
