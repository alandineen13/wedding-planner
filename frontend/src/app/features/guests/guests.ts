import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { GuestService } from '../../core/services/guest.service';
import { WeddingRsvpService } from '../../core/services/wedding-rsvp.service';
import { Guest, RsvpStatus } from '../../shared/models/guest.model';
import { GuestFormComponent } from './guest-form/guest-form';
import QRCode from 'qrcode';

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [
    FormsModule, TitleCasePipe,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatTooltipModule, MatDialogModule, MatSnackBarModule,
    MatMenuModule, MatCardModule,
  ],
  templateUrl: './guests.html',
  styleUrl: './guests.css',
})
export class GuestsComponent implements OnInit {
  private guestSvc = inject(GuestService);
  private weddingRsvpSvc = inject(WeddingRsvpService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  rsvpCode = signal('');
  rsvpQr = signal('');
  readonly rsvpUrl = computed(() =>
    this.rsvpCode() ? `${window.location.origin}/wedding-rsvp/${this.rsvpCode()}` : ''
  );

  searchQuery = signal('');
  rsvpFilter = signal<RsvpStatus | ''>('');
  sideFilter = signal<'bride' | 'groom' | 'both' | ''>('');

  readonly stats = this.guestSvc.stats;

  readonly filteredGuests = computed(() => {
    let guests = this.guestSvc.guests();
    const q = this.searchQuery().toLowerCase();
    if (q) {
      guests = guests.filter(g =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.group?.toLowerCase().includes(q)
      );
    }
    if (this.rsvpFilter()) {
      guests = guests.filter(g => g.rsvpStatus === this.rsvpFilter());
    }
    if (this.sideFilter()) {
      guests = guests.filter(g => g.side === this.sideFilter());
    }
    return guests;
  });

  readonly displayedColumns = ['name', 'email', 'rsvpStatus', 'dietary', 'plusOne', 'side', 'group', 'actions'];

  ngOnInit(): void {
    this.weddingRsvpSvc.getMyCode().subscribe({
      next: ({ code }) => this.setCode(code),
    });
  }

  private setCode(code: string): void {
    this.rsvpCode.set(code);
    const url = `${window.location.origin}/wedding-rsvp/${code}`;
    QRCode.toDataURL(url, { width: 180, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then(dataUrl => this.rsvpQr.set(dataUrl));
  }

  downloadQrCode(): void {
    const a = document.createElement('a');
    a.href = this.rsvpQr();
    a.download = 'wedding-rsvp-qr.png';
    a.click();
  }

  copyWeddingRsvpLink(): void {
    navigator.clipboard.writeText(this.rsvpUrl()).then(() => {
      this.snackBar.open('RSVP link copied!', 'Close', { duration: 2000 });
    });
  }

  regenerateRsvpCode(): void {
    this.weddingRsvpSvc.regenerateCode().subscribe({
      next: ({ code }) => {
        this.setCode(code);
        this.snackBar.open('New RSVP link generated', 'Close', { duration: 3000 });
      },
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(GuestFormComponent, { width: '600px', data: null });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.guestSvc.add(result).subscribe({
          next: () => this.snackBar.open('Guest added successfully', 'Close', { duration: 3000 }),
          error: () => this.snackBar.open('Failed to add guest', 'Close', { duration: 3000 }),
        });
      }
    });
  }

  openEditDialog(guest: Guest): void {
    const ref = this.dialog.open(GuestFormComponent, { width: '600px', data: guest });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.guestSvc.update(guest.id, result).subscribe({
          next: () => this.snackBar.open('Guest updated', 'Close', { duration: 3000 }),
          error: () => this.snackBar.open('Failed to update guest', 'Close', { duration: 3000 }),
        });
      }
    });
  }

  deleteGuest(guest: Guest): void {
    if (confirm(`Remove ${guest.firstName} ${guest.lastName}?`)) {
      this.guestSvc.delete(guest.id).subscribe({
        next: () => this.snackBar.open('Guest removed', 'Close', { duration: 3000 }),
        error: () => this.snackBar.open('Failed to remove guest', 'Close', { duration: 3000 }),
      });
    }
  }

  copyRsvpLink(guest: Guest): void {
    const url = `${window.location.origin}/rsvp/${guest.rsvpToken}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('RSVP link copied!', 'Close', { duration: 2000 });
    });
  }

  getRsvpColor(status: RsvpStatus): string {
    const map: Record<RsvpStatus, string> = {
      confirmed: 'confirmed',
      declined: 'declined',
      pending: 'pending',
      maybe: 'maybe',
    };
    return map[status];
  }

  getRsvpIcon(status: RsvpStatus): string {
    const map: Record<RsvpStatus, string> = {
      confirmed: 'check_circle',
      declined: 'cancel',
      pending: 'schedule',
      maybe: 'help',
    };
    return map[status];
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.rsvpFilter.set('');
    this.sideFilter.set('');
  }
}
