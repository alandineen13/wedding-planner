import { Component, inject, signal, computed, OnInit } from '@angular/core';
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

type Step = 'attendance' | 'details' | 'extras' | 'submitted';

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
  currentStep = signal<Step>('attendance');

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
    const found = this.guestSvc.getByRsvpToken(t);
    if (found) {
      this.guest.set(found);
      const status = found.rsvpStatus;
      if (status !== 'pending') {
        this.attending.set(status === 'confirmed' ? 'yes' : 'no');
        this.mealPreference.set(found.mealPreference);
        this.dietaryRequirements.set(found.dietaryRequirements ?? '');
        this.plusOneName.set(found.plusOne?.name ?? '');
        this.accommodationRequired.set(found.accommodationRequired ?? false);
        this.transportRequired.set(found.transportRequired ?? false);
        this.songRequest.set(found.songRequest ?? '');
        this.message.set(found.message ?? '');
        this.currentStep.set('submitted');
      }
    } else {
      this.notFound.set(true);
    }
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

    this.guestSvc.submitRsvp(g.rsvpToken, data);
    this.currentStep.set('submitted');
  }
}
