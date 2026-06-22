import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatListModule, MatIconModule, MatDividerModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  navItemClicked = output<void>();

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Guests', icon: 'people', route: '/guests' },
    { label: 'Seating', icon: 'chair', route: '/seating' },
    { label: 'Budget', icon: 'account_balance_wallet', route: '/budget' },
    { label: 'Suppliers', icon: 'storefront', route: '/suppliers' },
    { label: 'Tasks', icon: 'checklist', route: '/tasks' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];
}
