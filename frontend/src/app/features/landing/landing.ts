import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {
  readonly features = [
    {
      icon: 'people',
      title: 'Guest Management',
      description: 'Track RSVPs, dietary requirements, plus-ones, and table side for every guest on your list.',
    },
    {
      icon: 'chair',
      title: 'Seating Planner',
      description: 'Assign guests to tables visually. Round, rectangular, or oval — lay out your venue your way.',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Budget Tracker',
      description: 'Log estimates and actuals, track deposits and payments, and spot overspend before it happens.',
    },
    {
      icon: 'storefront',
      title: 'Supplier Hub',
      description: 'Manage vendors, store contracts, track ratings, and keep every contact in one place.',
    },
    {
      icon: 'task_alt',
      title: 'Task Manager',
      description: 'Stay on schedule with prioritised tasks, due dates, and a clear view of what\'s left to do.',
    },
    {
      icon: 'favorite',
      title: 'Wedding Countdown',
      description: 'A live countdown to your big day on every page — because every day brings you closer.',
    },
  ];
}
