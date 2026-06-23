import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Supplier } from '../../shared/models/supplier.model';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/suppliers`;

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);
  private _suppliers = signal<Supplier[]>([]);

  readonly suppliers = this._suppliers.asReadonly();

  constructor() { this.load(); }

  private load(): void {
    this.http.get<Supplier[]>(API).subscribe(suppliers => this._suppliers.set(suppliers));
  }

  add(supplier: Omit<Supplier, 'id' | 'createdAt'>): Observable<Supplier> {
    return this.http.post<Supplier>(API, supplier).pipe(
      tap(s => this._suppliers.update(list => [...list, s]))
    );
  }

  update(id: string, changes: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${API}/${id}`, changes).pipe(
      tap(s => this._suppliers.update(list => list.map(x => x.id === id ? s : x)))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`).pipe(
      tap(() => this._suppliers.update(list => list.filter(s => s.id !== id)))
    );
  }
}
