export type RsvpStatus = 'pending' | 'confirmed' | 'declined' | 'maybe';
export type InviteStatus = 'not_sent' | 'sent' | 'delivered';
export type MealPreference = 'chicken' | 'beef' | 'fish' | 'vegetarian' | 'vegan' | 'kids';

export interface PlusOne {
  name: string;
  mealPreference?: MealPreference;
  dietaryRequirements?: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  inviteStatus: InviteStatus;
  rsvpStatus: RsvpStatus;
  mealPreference?: MealPreference;
  dietaryRequirements?: string;
  plusOneAllowed: boolean;
  plusOne?: PlusOne;
  tableId?: string;
  seatNumber?: number;
  rsvpToken: string;
  rsvpSubmittedAt?: string;
  accommodationRequired?: boolean;
  transportRequired?: boolean;
  songRequest?: string;
  message?: string;
  group?: string;
  side: 'bride' | 'groom' | 'both';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
