import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WeddingPublicInfo {
  userName: string;
  partnerName: string | null;
  weddingDate: string | null;
  venueName: string | null;
}

export interface PublicRsvpPayload {
  firstName: string;
  lastName: string;
  email?: string;
  rsvpStatus: 'confirmed' | 'declined';
  dietaryRequirements?: string;
  message?: string;
}

const API = `${environment.apiUrl}/wedding-rsvp`;

@Injectable({ providedIn: 'root' })
export class WeddingRsvpService {
  private http = inject(HttpClient);

  getMyCode(): Observable<{ code: string }> {
    return this.http.get<{ code: string }>(`${API}/mine`);
  }

  regenerateCode(): Observable<{ code: string }> {
    return this.http.post<{ code: string }>(`${API}/mine/regenerate`, {});
  }

  getWeddingByCode(code: string): Observable<WeddingPublicInfo> {
    return this.http.get<WeddingPublicInfo>(`${API}/${code}`);
  }

  submitRsvp(code: string, payload: PublicRsvpPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/${code}`, payload);
  }
}
