import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SidebarComponent } from '../sidebar/sidebar';
import { TopbarComponent } from '../topbar/topbar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShellComponent {
  sidebarCollapsed = signal(false);
  mobileOpen = signal(false);

  constructor(private breakpoints: BreakpointObserver) {
    this.breakpoints.observe([Breakpoints.HandsetPortrait, Breakpoints.TabletPortrait])
      .subscribe(result => {
        if (result.matches) {
          this.sidebarCollapsed.set(true);
        }
      });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }
}
