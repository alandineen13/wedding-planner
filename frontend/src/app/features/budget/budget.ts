import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetItem, BudgetCategory, PaymentStatus } from '../../shared/models/budget.model';

interface BudgetFormData {
  name: string;
  category: BudgetCategory;
  estimatedCost: number;
  actualCost: number | null;
  paymentStatus: PaymentStatus;
  notes: string;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, TitleCasePipe, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatSnackBarModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class BudgetComponent {
  private budgetSvc = inject(BudgetService);
  private snackBar = inject(MatSnackBar);

  readonly items = this.budgetSvc.items;
  readonly summary = this.budgetSvc.summary;
  readonly totalBudget = this.budgetSvc.totalBudget;

  showAddForm = signal(false);
  editingId = signal<string | null>(null);

  formData: BudgetFormData = {
    name: '',
    category: 'other',
    estimatedCost: 0,
    actualCost: null,
    paymentStatus: 'unpaid',
    notes: '',
  };

  readonly displayedColumns = ['name', 'category', 'estimated', 'actual', 'paymentStatus', 'actions'];
  readonly categories: BudgetCategory[] = ['venue', 'catering', 'photography', 'videography', 'flowers', 'entertainment', 'attire', 'accommodation', 'transport', 'stationery', 'hair_makeup', 'cake', 'rings', 'honeymoon', 'other'];

  readonly budgetUsedPct = computed(() => {
    const s = this.summary();
    if (!s.totalBudget) return 0;
    return Math.min(100, Math.round((s.totalActual / s.totalBudget) * 100));
  });

  toggleForm(): void {
    this.showAddForm.set(!this.showAddForm());
  }

  saveItem(): void {
    if (!this.formData.name || !this.formData.estimatedCost) return;
    const item: Omit<BudgetItem, 'id' | 'createdAt'> = {
      name: this.formData.name,
      category: this.formData.category,
      estimatedCost: this.formData.estimatedCost,
      actualCost: this.formData.actualCost ?? undefined,
      paymentStatus: this.formData.paymentStatus,
      notes: this.formData.notes || undefined,
    };
    if (this.editingId()) {
      this.budgetSvc.update(this.editingId()!, item).subscribe({
        next: () => { this.snackBar.open('Item updated', 'Close', { duration: 2000 }); this.resetForm(); },
        error: () => this.snackBar.open('Failed to save item', 'Close', { duration: 2000 }),
      });
    } else {
      this.budgetSvc.add(item).subscribe({
        next: () => { this.snackBar.open('Budget item added', 'Close', { duration: 2000 }); this.resetForm(); },
        error: () => this.snackBar.open('Failed to add item', 'Close', { duration: 2000 }),
      });
    }
  }

  editItem(item: BudgetItem): void {
    this.editingId.set(item.id);
    this.formData = {
      name: item.name,
      category: item.category,
      estimatedCost: item.estimatedCost,
      actualCost: item.actualCost ?? null,
      paymentStatus: item.paymentStatus,
      notes: item.notes ?? '',
    };
    this.showAddForm.set(true);
  }

  deleteItem(id: string): void {
    if (confirm('Remove this budget item?')) {
      this.budgetSvc.delete(id).subscribe({
        error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 2000 }),
      });
    }
  }

  resetForm(): void {
    this.showAddForm.set(false);
    this.editingId.set(null);
    this.formData = { name: '', category: 'other', estimatedCost: 0, actualCost: null, paymentStatus: 'unpaid', notes: '' };
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    const map: Record<PaymentStatus, string> = { paid: 'paid', deposit_paid: 'deposit', partially_paid: 'partial', unpaid: 'unpaid' };
    return map[status];
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    const map: Record<PaymentStatus, string> = { paid: 'Paid', deposit_paid: 'Deposit Paid', partially_paid: 'Partial', unpaid: 'Unpaid' };
    return map[status];
  }

  getVarianceClass(): string {
    return this.summary().variance >= 0 ? 'positive' : 'negative';
  }
}
