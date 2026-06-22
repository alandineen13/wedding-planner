import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { Guest } from '../../../shared/models/guest.model';

interface GuestFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  side: 'bride' | 'groom' | 'both';
  group: string;
  inviteStatus: Guest['inviteStatus'];
  rsvpStatus: Guest['rsvpStatus'];
  dietaryRequirements: string;
  plusOneAllowed: boolean;
  plusOneName: string;
  accommodationRequired: boolean;
  transportRequired: boolean;
  notes: string;
}

@Component({
  selector: 'app-guest-form',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatDividerModule],
  templateUrl: './guest-form.html',
  styleUrl: './guest-form.css',
})
export class GuestFormComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GuestFormComponent>);
  private existingGuest = inject<Guest | null>(MAT_DIALOG_DATA);

  isEdit = signal(false);

  form: GuestFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    side: 'bride',
    group: '',
    inviteStatus: 'not_sent',
    rsvpStatus: 'pending',
    dietaryRequirements: '',
    plusOneAllowed: false,
    plusOneName: '',
    accommodationRequired: false,
    transportRequired: false,
    notes: '',
  };

  ngOnInit(): void {
    if (this.existingGuest) {
      this.isEdit.set(true);
      const g = this.existingGuest;
      this.form = {
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email ?? '',
        phone: g.phone ?? '',
        address: g.address ?? '',
        side: g.side,
        group: g.group ?? '',
        inviteStatus: g.inviteStatus,
        rsvpStatus: g.rsvpStatus,
        dietaryRequirements: g.dietaryRequirements ?? '',
        plusOneAllowed: g.plusOneAllowed,
        plusOneName: g.plusOne?.name ?? '',
        accommodationRequired: g.accommodationRequired ?? false,
        transportRequired: g.transportRequired ?? false,
        notes: g.notes ?? '',
      };
    }
  }

  save(): void {
    const f = this.form;
    if (!f.firstName || !f.lastName) return;

    const result: Partial<Guest> = {
      firstName: f.firstName,
      lastName: f.lastName,
      email: f.email || undefined,
      phone: f.phone || undefined,
      address: f.address || undefined,
      side: f.side,
      group: f.group || undefined,
      inviteStatus: f.inviteStatus,
      rsvpStatus: f.rsvpStatus,
      dietaryRequirements: f.dietaryRequirements || undefined,
      plusOneAllowed: f.plusOneAllowed,
      plusOne: f.plusOneAllowed && f.plusOneName ? {
        name: f.plusOneName,
      } : undefined,
      accommodationRequired: f.accommodationRequired,
      transportRequired: f.transportRequired,
      notes: f.notes || undefined,
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
