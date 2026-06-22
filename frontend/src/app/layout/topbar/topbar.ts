import { Component, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, DatePipe, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule, MatDividerModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class TopbarComponent {
  menuToggled = output<void>();
  private auth = inject(AuthService);
  readonly user = this.auth.user;

  logout(): void {
    this.auth.logout();
  }
}
