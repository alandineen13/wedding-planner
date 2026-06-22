import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { GuestService } from '../../core/services/guest.service';
import { Guest } from '../../shared/models/guest.model';

type Step = 'loading' | 'attendance' | 'details' | 'extras' | 'submitted';

@Component({
  selector: 'app-rsvp',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatCardModule, MatRadioModule, MatStepperModule],
  templateUrl: './rsvp.html',
  styleUrl: './rsvp.css',
})
export class RsvpComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private guestSvc = inject(GuestService);

  token = signal('');
  guest = signal<Guest | null>(null);
  notFound = signal(false);
  currentStep = signal<Step>('loading');

  attending = signal<'yes' | 'no' | ''>('');
  mealPreference = signal<Guest['mealPreference']>(undefined);
  dietaryRequirements = signal('');
  plusOneName = signal('');
  plusOneMeal = signal<Guest['mealPreference']>(undefined);
  accommodationRequired = signal(false);
  transportRequired = signal(false);
  songRequest = signal('');
  message = signal('');

  ngOnInit(): void {
    const t = this.route.snapshot.paramMap.get('token') ?? '';
    this.token.set(t);
    this.guestSvc.getByRsvpToken(t).subscribe({
      next: (found) => {
        this.guest.set(found);
        if (found.rsvpStatus !== 'pending') {
          this.attending.set(found.rsvpStatus === 'confirmed' ? 'yes' : 'no');
          this.mealPreference.set(found.mealPreference);
          this.dietaryRequirements.set(found.dietaryRequirements ?? '');
          this.plusOneName.set(found.plusOne?.name ?? '');
          this.accommodationRequired.set(found.accommodationRequired ?? false);
          this.transportRequired.set(found.transportRequired ?? false);
          this.songRequest.set(found.songRequest ?? '');
          this.message.set(found.message ?? '');
          this.currentStep.set('submitted');
        } else {
          this.currentStep.set('attendance');
        }
      },
      error: () => {
        this.notFound.set(true);
        this.currentStep.set('attendance');
      },
    });
  }

  nextStep(): void {
    if (this.currentStep() === 'attendance') {
      if (this.attending() === 'no') {
        this.submitRsvp();
      } else {
        this.currentStep.set('details');
      }
    } else if (this.currentStep() === 'details') {
      this.currentStep.set('extras');
    } else if (this.currentStep() === 'extras') {
      this.submitRsvp();
    }
  }

  prevStep(): void {
    if (this.currentStep() === 'details') this.currentStep.set('attendance');
    else if (this.currentStep() === 'extras') this.currentStep.set('details');
  }

  submitRsvp(): void {
    const g = this.guest();
    if (!g) return;

    const data: Partial<Guest> = {
      rsvpStatus: this.attending() === 'yes' ? 'confirmed' : 'declined',
      mealPreference: this.mealPreference(),
      dietaryRequirements: this.dietaryRequirements() || undefined,
      plusOne: g.plusOneAllowed && this.plusOneName()
        ? { name: this.plusOneName(), mealPreference: this.plusOneMeal() }
        : undefined,
      accommodationRequired: this.accommodationRequired(),
      transportRequired: this.transportRequired(),
      songRequest: this.songRequest() || undefined,
      message: this.message() || undefined,
    };

    this.guestSvc.submitRsvp(g.rsvpToken, data).subscribe({
      next: () => this.currentStep.set('submitted'),
    });
  }
}
