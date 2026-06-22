import { Injectable, signal } from '@angular/core';
import { Supplier } from '../../shared/models/supplier.model';

const MOCK_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'The Grand Hall', category: 'venue', contactName: 'Mary Collins', email: 'mary@grandhall.ie', phone: '+353 1 234 5678', contractStatus: 'signed', totalCost: 8500, depositAmount: 2000, depositPaid: true, balanceDue: 6500, balanceDueDate: '2025-08-20',createdAt: '2025-01-01' },
  { id: '2', name: 'Gourmet Catering Co.', category: 'catering', contactName: 'John Burke', email: 'john@gourmet.ie', contractStatus: 'signed', totalCost: 6200, depositAmount: 1000, depositPaid: false,createdAt: '2025-01-01' },
  { id: '3', name: 'Lens & Love Photography', category: 'photography', contactName: 'Sarah Keane', email: 'sarah@lensandlove.ie', website: 'https://lensandlove.ie', contractStatus: 'signed', totalCost: 3500, depositAmount: 500, depositPaid: true, balanceDue: 3000,createdAt: '2025-01-02' },
  { id: '4', name: 'Blooms & Petals', category: 'florist', contactName: 'Anne Fitzpatrick', email: 'anne@blooms.ie', contractStatus: 'pending', totalCost: 1200,createdAt: '2025-01-03' },
  { id: '5', name: 'DJ Pete Events', category: 'entertainment', contactName: 'Pete Murphy', phone: '+353 86 999 1234', contractStatus: 'signed', totalCost: 1000, depositAmount: 300, depositPaid: true, balanceDue: 700,createdAt: '2025-01-03' },
];

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private _suppliers = signal<Supplier[]>(MOCK_SUPPLIERS);
  readonly suppliers = this._suppliers.asReadonly();

  add(supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const newSupplier: Supplier = {
      ...supplier,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this._suppliers.update(list => [...list, newSupplier]);
    return newSupplier;
  }

  update(id: string, changes: Partial<Supplier>): void {
    this._suppliers.update(list => list.map(s => s.id === id ? { ...s, ...changes } : s));
  }

  delete(id: string): void {
    this._suppliers.update(list => list.filter(s => s.id !== id));
  }
}
