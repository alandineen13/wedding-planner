import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SeatingService } from '../../core/services/seating.service';
import { GuestService } from '../../core/services/guest.service';
import { SeatingTable } from '../../shared/models/table.model';
import { Guest } from '../../shared/models/guest.model';

@Component({
  selector: 'app-seating',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatTooltipModule, MatMenuModule],
  templateUrl: './seating.html',
  styleUrl: './seating.css',
})
export class SeatingComponent {
  private seatingSvc = inject(SeatingService);
  private guestSvc = inject(GuestService);
  private snackBar = inject(MatSnackBar);

  readonly tables = this.seatingSvc.tables;
  readonly stats = this.seatingSvc.stats;
  readonly allGuests = this.guestSvc.guests;

  showAddTable = signal(false);
  newTableName = signal('');
  newTableCapacity = signal(10);
  newTableShape = signal<SeatingTable['shape']>('round');

  selectedTableId = signal<string | null>(null);
  guestSearchQuery = signal('');

  readonly unassignedGuests = computed(() => {
    const q = this.guestSearchQuery().toLowerCase();
    return this.allGuests()
      .filter(g => g.rsvpStatus === 'confirmed' && !g.tableId)
      .filter(g => !q || `${g.firstName} ${g.lastName}`.toLowerCase().includes(q));
  });

  getTableGuests(table: SeatingTable): Guest[] {
    return table.guestIds.map(id => this.allGuests().find(g => g.id === id)!).filter(Boolean);
  }

  getOccupancyPct(table: SeatingTable): number {
    return Math.round((table.guestIds.length / table.capacity) * 100);
  }

  addTable(): void {
    if (!this.newTableName()) return;
    this.seatingSvc.add({
      name: this.newTableName(),
      capacity: this.newTableCapacity(),
      shape: this.newTableShape(),
      guestIds: [],
    });
    this.newTableName.set('');
    this.newTableCapacity.set(10);
    this.showAddTable.set(false);
    this.snackBar.open('Table added', 'Close', { duration: 2000 });
  }

  deleteTable(tableId: string): void {
    const table = this.tables().find(t => t.id === tableId);
    if (!table) return;
    table.guestIds.forEach(gid => this.guestSvc.update(gid, { tableId: undefined }));
    this.seatingSvc.delete(tableId);
  }

  assignGuest(tableId: string, guestId: string): void {
    const table = this.tables().find(t => t.id === tableId);
    if (!table || table.guestIds.length >= table.capacity) {
      this.snackBar.open('Table is full!', 'Close', { duration: 2000 });
      return;
    }
    this.seatingSvc.assignGuest(tableId, guestId);
    this.guestSvc.update(guestId, { tableId });
    this.snackBar.open('Guest assigned to table', 'Close', { duration: 2000 });
  }

  removeFromTable(guestId: string): void {
    this.seatingSvc.removeGuest(guestId);
    this.guestSvc.update(guestId, { tableId: undefined });
  }

  selectTable(id: string | null): void {
    this.selectedTableId.set(id);
  }

  toggleAddTable(): void {
    this.showAddTable.set(!this.showAddTable());
  }

  getEmptySeats(table: SeatingTable): number[] {
    return Array(Math.max(0, table.capacity - table.guestIds.length)).fill(0);
  }
}
