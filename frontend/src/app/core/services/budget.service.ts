import { Injectable, signal, computed } from '@angular/core';
import { BudgetItem, BudgetSummary } from '../../shared/models/budget.model';

const TOTAL_BUDGET = 25000;

const MOCK_ITEMS: BudgetItem[] = [
  { id: '1', name: 'The Grand Hall', category: 'venue', estimatedCost: 8000, actualCost: 8500, depositAmount: 2000, depositPaid: true, paymentStatus: 'deposit_paid', createdAt: '2025-01-01' },
  { id: '2', name: 'Gourmet Catering Co.', category: 'catering', estimatedCost: 6000, actualCost: 6200, paymentStatus: 'unpaid', createdAt: '2025-01-01' },
  { id: '3', name: 'Photo & Video Package', category: 'photography', estimatedCost: 3500, actualCost: 3500, depositAmount: 500, depositPaid: true, paymentStatus: 'deposit_paid', createdAt: '2025-01-02' },
  { id: '4', name: 'Floral Arrangements', category: 'flowers', estimatedCost: 1200, paymentStatus: 'unpaid', createdAt: '2025-01-02' },
  { id: '5', name: 'Wedding Dress', category: 'attire', estimatedCost: 1500, actualCost: 1800, paymentStatus: 'paid', createdAt: '2025-01-03' },
  { id: '6', name: 'DJ & Entertainment', category: 'entertainment', estimatedCost: 1000, actualCost: 1000, depositAmount: 300, depositPaid: true, paymentStatus: 'deposit_paid', createdAt: '2025-01-03' },
  { id: '7', name: 'Wedding Cake', category: 'cake', estimatedCost: 600, paymentStatus: 'unpaid', createdAt: '2025-01-04' },
  { id: '8', name: 'Transport & Limo', category: 'transport', estimatedCost: 800, actualCost: 800, paymentStatus: 'paid', createdAt: '2025-01-04' },
];

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private _items = signal<BudgetItem[]>(MOCK_ITEMS);
  readonly totalBudget = signal<number>(TOTAL_BUDGET);

  readonly items = this._items.asReadonly();

  readonly summary = computed((): BudgetSummary => {
    const items = this._items();
    const totalEstimated = items.reduce((sum, i) => sum + i.estimatedCost, 0);
    const totalActual = items.reduce((sum, i) => sum + (i.actualCost ?? 0), 0);
    const totalPaid = items
      .filter(i => i.paymentStatus === 'paid')
      .reduce((sum, i) => sum + (i.actualCost ?? i.estimatedCost), 0);
    const totalOutstanding = totalActual - totalPaid;
    return {
      totalBudget: this.totalBudget(),
      totalEstimated,
      totalActual,
      totalPaid,
      totalOutstanding,
      variance: this.totalBudget() - totalActual,
    };
  });

  add(item: Omit<BudgetItem, 'id' | 'createdAt'>): BudgetItem {
    const newItem: BudgetItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this._items.update(list => [...list, newItem]);
    return newItem;
  }

  update(id: string, changes: Partial<BudgetItem>): void {
    this._items.update(list => list.map(i => i.id === id ? { ...i, ...changes } : i));
  }

  delete(id: string): void {
    this._items.update(list => list.filter(i => i.id !== id));
  }
}
