import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');
  hidePassword = signal(true);

  private auth = inject(AuthService);

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login({ email: this.email(), password: this.password() });
      window.location.href = '/dashboard';
    } catch (err: any) {
      this.error.set(err.error?.message ?? err.message ?? 'Login failed');
    } finally {
      this.loading.set(false);
    }
  }
}
