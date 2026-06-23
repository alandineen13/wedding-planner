import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Guest } from '../../shared/models/guest.model';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/guests`;

@Injectable({ providedIn: 'root' })
export class GuestService {
  private http = inject(HttpClient);
  private _guests = signal<Guest[]>([]);

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
      totalAttending:
        g.filter(x => x.rsvpStatus === 'confirmed').length +
        g.filter(x => x.rsvpStatus === 'confirmed' && x.plusOne).length,
    };
  });

  constructor() { this.load(); }

  private load(): void {
    this.http.get<Guest[]>(API).subscribe(guests => this._guests.set(guests));
  }

  add(data: Partial<Guest>): Observable<Guest> {
    return this.http.post<Guest>(API, data).pipe(
      tap(guest => this._guests.update(list => [...list, guest]))
    );
  }

  update(id: string, changes: Partial<Guest>): Observable<Guest> {
    return this.http.put<Guest>(`${API}/${id}`, changes).pipe(
      tap(guest => this._guests.update(list => list.map(g => g.id === id ? guest : g)))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`).pipe(
      tap(() => this._guests.update(list => list.filter(g => g.id !== id)))
    );
  }

  getByRsvpToken(token: string): Observable<Guest> {
    return this.http.get<Guest>(`${environment.apiUrl}/rsvp/${token}`);
  }

  submitRsvp(token: string, data: Partial<Guest>): Observable<Guest> {
    return this.http.put<Guest>(`${environment.apiUrl}/rsvp/${token}`, data);
  }
}
