import { Injectable, signal, computed } from '@angular/core';
import { Guest, RsvpStatus, InviteStatus } from '../../shared/models/guest.model';

const MOCK_GUESTS: Guest[] = [
  {
    id: '1', firstName: 'Emma', lastName: 'Thompson', email: 'emma@example.com',
    phone: '+353 87 123 4567', inviteStatus: 'sent', rsvpStatus: 'confirmed',
    mealPreference: 'chicken', plusOneAllowed: true,
    plusOne: { name: 'Tom Thompson', mealPreference: 'beef' },
    side: 'bride', group: 'Family', rsvpToken: 'rsvp-001',
    rsvpSubmittedAt: '2025-01-15', tableId: '1',
    createdAt: '2025-01-01', updatedAt: '2025-01-15',
  },
  {
    id: '2', firstName: 'Michael', lastName: 'O\'Brien', email: 'michael@example.com',
    inviteStatus: 'sent', rsvpStatus: 'confirmed', mealPreference: 'beef',
    plusOneAllowed: false, side: 'groom', group: 'Family', rsvpToken: 'rsvp-002',
    rsvpSubmittedAt: '2025-01-20', tableId: '1',
    createdAt: '2025-01-01', updatedAt: '2025-01-20',
  },
  {
    id: '3', firstName: 'Claire', lastName: 'Walsh', email: 'claire@example.com',
    inviteStatus: 'sent', rsvpStatus: 'declined', plusOneAllowed: true,
    side: 'bride', group: 'Friends', rsvpToken: 'rsvp-003',
    rsvpSubmittedAt: '2025-01-18', createdAt: '2025-01-01', updatedAt: '2025-01-18',
  },
  {
    id: '4', firstName: 'Liam', lastName: 'Murphy', email: 'liam@example.com',
    inviteStatus: 'sent', rsvpStatus: 'pending', plusOneAllowed: true,
    side: 'groom', group: 'Friends', rsvpToken: 'rsvp-004',
    createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  {
    id: '5', firstName: 'Aoife', lastName: 'Kelly', email: 'aoife@example.com',
    inviteStatus: 'sent', rsvpStatus: 'maybe', mealPreference: 'vegetarian',
    dietaryRequirements: 'Gluten free', plusOneAllowed: false,
    side: 'bride', group: 'Work', rsvpToken: 'rsvp-005',
    rsvpSubmittedAt: '2025-01-22', createdAt: '2025-01-02', updatedAt: '2025-01-22',
  },
  {
    id: '6', firstName: 'Conor', lastName: 'Ryan', email: 'conor@example.com',
    inviteStatus: 'not_sent', rsvpStatus: 'pending', plusOneAllowed: true,
    side: 'groom', group: 'Work', rsvpToken: 'rsvp-006',
    createdAt: '2025-01-05', updatedAt: '2025-01-05',
  },
  {
    id: '7', firstName: 'Siobhan', lastName: 'Doyle', email: 'siobhan@example.com',
    inviteStatus: 'sent', rsvpStatus: 'confirmed', mealPreference: 'fish',
    plusOneAllowed: true, plusOne: { name: 'Peter Doyle', mealPreference: 'beef' },
    side: 'bride', group: 'Family', rsvpToken: 'rsvp-007',
    rsvpSubmittedAt: '2025-01-25', tableId: '2',
    createdAt: '2025-01-02', updatedAt: '2025-01-25',
  },
  {
    id: '8', firstName: 'Patrick', lastName: 'Brennan', email: 'pat@example.com',
    inviteStatus: 'sent', rsvpStatus: 'confirmed', mealPreference: 'beef',
    plusOneAllowed: false, side: 'groom', group: 'Family', rsvpToken: 'rsvp-008',
    rsvpSubmittedAt: '2025-01-28', tableId: '2',
    createdAt: '2025-01-02', updatedAt: '2025-01-28',
  },
];

@Injectable({ providedIn: 'root' })
export class GuestService {
  private _guests = signal<Guest[]>(MOCK_GUESTS);

  readonly guests = this._guests.asReadonly();

  readonly stats = computed(() => {
    const g = this._guests();
    return {
      total: g.length,
      confirmed: g.filter(x => x.rsvpStatus === 'confirmed').length,
      declined: g.filter(x => x.rsvpStatus === 'declined').length,
      pending: g.filter(x => x.rsvpStatus === 'pending').length,
      maybe: g.filter(x => x.rsvpStatus === 'maybe').length,
      plusOnes: g.filter(x => x.plusOne).length,
      totalAttending: g.filter(x => x.rsvpStatus === 'confirmed').length +
        g.filter(x => x.rsvpStatus === 'confirmed' && x.plusOne).length,
    };
  });

  getById(id: string): Guest | undefined {
    return this._guests().find(g => g.id === id);
  }

  getByRsvpToken(token: string): Guest | undefined {
    return this._guests().find(g => g.rsvpToken === token);
  }

  add(guest: Omit<Guest, 'id' | 'rsvpToken' | 'createdAt' | 'updatedAt'>): Guest {
    const now = new Date().toISOString();
    const newGuest: Guest = {
      ...guest,
      id: crypto.randomUUID(),
      rsvpToken: 'rsvp-' + crypto.randomUUID().slice(0, 8),
      createdAt: now,
      updatedAt: now,
    };
    this._guests.update(list => [...list, newGuest]);
    return newGuest;
  }

  update(id: string, changes: Partial<Guest>): void {
    this._guests.update(list =>
      list.map(g => g.id === id ? { ...g, ...changes, updatedAt: new Date().toISOString() } : g)
    );
  }

  delete(id: string): void {
    this._guests.update(list => list.filter(g => g.id !== id));
  }

  submitRsvp(token: string, data: Partial<Guest>): boolean {
    const guest = this.getByRsvpToken(token);
    if (!guest) return false;
    this.update(guest.id, { ...data, rsvpSubmittedAt: new Date().toISOString() });
    return true;
  }
}
