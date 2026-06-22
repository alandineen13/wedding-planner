import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatDividerModule, MatSnackBarModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly user = this.auth.user;

  name = signal(this.user()?.name ?? '');
  email = signal(this.user()?.email ?? '');
  weddingDate = signal(this.user()?.weddingDate ?? '');
  venueName = signal(this.user()?.venueName ?? '');
  partnerName = signal(this.user()?.partnerName ?? '');

  saveProfile(): void {
    this.snackBar.open('Settings saved (Phase 2 will persist this via API)', 'Close', { duration: 3000 });
  }

  logout(): void {
    this.auth.logout();
  }
}
