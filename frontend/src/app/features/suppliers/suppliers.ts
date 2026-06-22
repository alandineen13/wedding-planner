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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SupplierService } from '../../core/services/supplier.service';
import { Supplier, SupplierCategory } from '../../shared/models/supplier.model';

interface SupplierFormData {
  name: string;
  category: SupplierCategory;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  contractStatus: Supplier['contractStatus'];
  totalCost: number | null;
  depositAmount: number | null;
  depositPaid: boolean;
  notes: string;
}

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, TitleCasePipe, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatSnackBarModule, MatTooltipModule, MatCheckboxModule],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css',
})
export class SuppliersComponent {
  private supplierSvc = inject(SupplierService);
  private snackBar = inject(MatSnackBar);

  readonly suppliers = this.supplierSvc.suppliers;
  showForm = signal(false);
  editingId = signal<string | null>(null);
  searchQuery = signal('');

  formData: SupplierFormData = {
    name: '', category: 'other', contactName: '', email: '', phone: '',
    website: '', contractStatus: 'none', totalCost: null,
    depositAmount: null, depositPaid: false, notes: '',
  };

  readonly categories: SupplierCategory[] = ['venue', 'catering', 'photography', 'videography', 'florist', 'entertainment', 'attire', 'hair_makeup', 'cake', 'transport', 'accommodation', 'other'];

  readonly filteredSuppliers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.suppliers();
    return this.suppliers().filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.contactName?.toLowerCase().includes(q)
    );
  });

  readonly displayedColumns = ['name', 'category', 'contact', 'cost', 'contract', 'actions'];

  toggleForm(): void {
    this.showForm.set(!this.showForm());
  }

  saveSupplier(): void {
    if (!this.formData.name) return;
    const supplier: Omit<Supplier, 'id' | 'createdAt'> = {
      name: this.formData.name,
      category: this.formData.category,
      contactName: this.formData.contactName || undefined,
      email: this.formData.email || undefined,
      phone: this.formData.phone || undefined,
      website: this.formData.website || undefined,
      contractStatus: this.formData.contractStatus,
      totalCost: this.formData.totalCost ?? undefined,
      depositAmount: this.formData.depositAmount ?? undefined,
      depositPaid: this.formData.depositPaid,
      notes: this.formData.notes || undefined,
    };
    if (this.editingId()) {
      this.supplierSvc.update(this.editingId()!, supplier);
      this.snackBar.open('Supplier updated', 'Close', { duration: 2000 });
    } else {
      this.supplierSvc.add(supplier);
      this.snackBar.open('Supplier added', 'Close', { duration: 2000 });
    }
    this.resetForm();
  }

  editSupplier(supplier: Supplier): void {
    this.editingId.set(supplier.id);
    this.formData = {
      name: supplier.name,
      category: supplier.category,
      contactName: supplier.contactName ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      website: supplier.website ?? '',
      contractStatus: supplier.contractStatus,
      totalCost: supplier.totalCost ?? null,
      depositAmount: supplier.depositAmount ?? null,
      depositPaid: supplier.depositPaid ?? false,
      notes: supplier.notes ?? '',
    };
    this.showForm.set(true);
  }

  deleteSupplier(id: string): void {
    if (confirm('Remove this supplier?')) {
      this.supplierSvc.delete(id);
    }
  }

  resetForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formData = { name: '', category: 'other', contactName: '', email: '', phone: '', website: '', contractStatus: 'none', totalCost: null, depositAmount: null, depositPaid: false, notes: '' };
  }

  getContractColor(status: string): string {
    return status;
  }

}
