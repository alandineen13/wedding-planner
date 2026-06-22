import { Injectable, signal, computed } from '@angular/core';
import { SeatingTable } from '../../shared/models/table.model';

const MOCK_TABLES: SeatingTable[] = [
  { id: '1', name: 'Top Table', capacity: 8, shape: 'rectangular', guestIds: ['1', '2'], positionX: 400, positionY: 50 },
  { id: '2', name: 'Table 2', capacity: 10, shape: 'round', guestIds: ['7', '8'], positionX: 150, positionY: 200 },
  { id: '3', name: 'Table 3', capacity: 10, shape: 'round', guestIds: [], positionX: 400, positionY: 200 },
  { id: '4', name: 'Table 4', capacity: 10, shape: 'round', guestIds: [], positionX: 650, positionY: 200 },
];

@Injectable({ providedIn: 'root' })
export class SeatingService {
  private _tables = signal<SeatingTable[]>(MOCK_TABLES);

  readonly tables = this._tables.asReadonly();

  readonly stats = computed(() => {
    const t = this._tables();
    const totalSeats = t.reduce((sum, tbl) => sum + tbl.capacity, 0);
    const seatedGuests = t.reduce((sum, tbl) => sum + tbl.guestIds.length, 0);
    return { totalTables: t.length, totalSeats, seatedGuests, unseatedSeats: totalSeats - seatedGuests };
  });

  add(table: Omit<SeatingTable, 'id'>): SeatingTable {
    const newTable: SeatingTable = { ...table, id: crypto.randomUUID() };
    this._tables.update(list => [...list, newTable]);
    return newTable;
  }

  update(id: string, changes: Partial<SeatingTable>): void {
    this._tables.update(list => list.map(t => t.id === id ? { ...t, ...changes } : t));
  }

  delete(id: string): void {
    this._tables.update(list => list.filter(t => t.id !== id));
  }

  assignGuest(tableId: string, guestId: string): void {
    this._tables.update(list =>
      list.map(t => {
        const filtered = t.guestIds.filter(id => id !== guestId);
        if (t.id === tableId) {
          return { ...t, guestIds: [...filtered, guestId] };
        }
        return { ...t, guestIds: filtered };
      })
    );
  }

  removeGuest(guestId: string): void {
    this._tables.update(list =>
      list.map(t => ({ ...t, guestIds: t.guestIds.filter(id => id !== guestId) }))
    );
  }
}
