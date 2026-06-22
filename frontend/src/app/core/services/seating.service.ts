import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SeatingTable } from '../../shared/models/table.model';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/tables`;

@Injectable({ providedIn: 'root' })
export class SeatingService {
  private http = inject(HttpClient);
  private _tables = signal<SeatingTable[]>([]);

  readonly tables = this._tables.asReadonly();

  readonly stats = computed(() => {
    const t = this._tables();
    const totalSeats   = t.reduce((s, tbl) => s + tbl.capacity, 0);
    const seatedGuests = t.reduce((s, tbl) => s + tbl.guestIds.length, 0);
    return { totalTables: t.length, totalSeats, seatedGuests, unseatedSeats: totalSeats - seatedGuests };
  });

  constructor() { this.load(); }

  private load(): void {
    this.http.get<SeatingTable[]>(API).subscribe(tables => this._tables.set(tables));
  }

  add(table: Omit<SeatingTable, 'id'>): Observable<SeatingTable> {
    return this.http.post<SeatingTable>(API, table).pipe(
      tap(t => this._tables.update(list => [...list, t]))
    );
  }

  update(id: string, changes: Partial<SeatingTable>): Observable<SeatingTable> {
    return this.http.put<SeatingTable>(`${API}/${id}`, changes).pipe(
      tap(t => this._tables.update(list => list.map(x => x.id === id ? t : x)))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`).pipe(
      tap(() => this._tables.update(list => list.filter(t => t.id !== id)))
    );
  }

  assignGuest(tableId: string, guestId: string): Observable<SeatingTable> {
    return this.http.post<SeatingTable>(`${API}/${tableId}/assign-guest`, { guestId }).pipe(
      tap(table => this._tables.update(list => list.map(t => t.id === tableId ? table : t)))
    );
  }

  removeGuest(tableId: string, guestId: string): Observable<SeatingTable> {
    return this.http.delete<SeatingTable>(`${API}/${tableId}/guests/${guestId}`).pipe(
      tap(table => this._tables.update(list => list.map(t => t.id === tableId ? table : t)))
    );
  }
}
