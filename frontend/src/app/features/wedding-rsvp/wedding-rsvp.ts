import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WeddingRsvpService, WeddingPublicInfo } from '../../core/services/wedding-rsvp.service';

@Component({
  selector: 'app-wedding-rsvp',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatRadioModule, MatProgressSpinnerModule,
  ],
  templateUrl: './wedding-rsvp.html',
  styleUrl: './wedding-rsvp.css',
})
export class WeddingRsvpComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(WeddingRsvpService);

  code = signal('');
  wedding = signal<WeddingPublicInfo | null>(null);
  loadError = signal('');
  submitted = signal(false);
  submitting = signal(false);
  submitError = signal('');

  firstName = signal('');
  lastName = signal('');
  email = signal('');
  attending = signal<'confirmed' | 'declined'>('confirmed');
  dietaryRequirements = signal('');
  message = signal('');

  readonly coupleName = computed(() => {
    const w = this.wedding();
    if (!w) return '';
    return w.partnerName ? `${w.userName} & ${w.partnerName}` : w.userName;
  });

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    this.code.set(code);
    this.svc.getWeddingByCode(code).subscribe({
      next: info => this.wedding.set(info),
      error: () => this.loadError.set('This RSVP link is invalid or has expired.'),
    });
  }

  onSubmit(): void {
    if (!this.firstName() || !this.lastName()) return;
    this.submitting.set(true);
    this.submitError.set('');
    this.svc.submitRsvp(this.code(), {
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email() || undefined,
      rsvpStatus: this.attending(),
      dietaryRequirements: this.dietaryRequirements() || undefined,
      message: this.message() || undefined,
    }).subscribe({
      next: () => this.submitted.set(true),
      error: err => {
        this.submitError.set(err.error?.message ?? 'Something went wrong. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
