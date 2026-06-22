import { Component, inject, computed, ElementRef, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { GuestService } from '../../core/services/guest.service';
import { BudgetService } from '../../core/services/budget.service';
import { TaskService } from '../../core/services/task.service';
import { SeatingService } from '../../core/services/seating.service';
import { AuthService } from '../../core/auth/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, TitleCasePipe, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatChipsModule, MatDividerModule, MatListModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rsvpChart') rsvpChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('budgetChart') budgetChartRef!: ElementRef<HTMLCanvasElement>;

  private guestSvc = inject(GuestService);
  private budgetSvc = inject(BudgetService);
  private taskSvc = inject(TaskService);
  private seatingSvc = inject(SeatingService);
  private authSvc = inject(AuthService);

  private charts: Chart[] = [];

  readonly user = this.authSvc.user;
  readonly guestStats = this.guestSvc.stats;
  readonly budgetSummary = this.budgetSvc.summary;
  readonly taskStats = this.taskSvc.stats;
  readonly seatingStats = this.seatingSvc.stats;

  readonly upcomingTasks = computed(() =>
    this.taskSvc.tasks()
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5)
  );

  readonly daysUntilWedding = computed(() => {
    const date = this.user()?.weddingDate;
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  readonly taskProgress = computed(() => {
    const stats = this.taskStats();
    if (!stats.total) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  });

  readonly budgetUsedPct = computed(() => {
    const s = this.budgetSummary();
    if (!s.totalBudget) return 0;
    return Math.min(100, Math.round((s.totalActual / s.totalBudget) * 100));
  });

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initRsvpChart();
      this.initBudgetChart();
    }, 100);
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  private initRsvpChart(): void {
    const stats = this.guestStats();
    const ctx = this.rsvpChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Confirmed', 'Declined', 'Pending', 'Maybe'],
        datasets: [{
          data: [stats.confirmed, stats.declined, stats.pending, stats.maybe],
          backgroundColor: ['#4caf50', '#f44336', '#ff9800', '#2196f3'],
          borderWidth: 2,
          borderColor: '#424242',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'rgba(255,255,255,0.8)', padding: 16, font: { size: 13 } },
          },
        },
        cutout: '65%',
      },
    });
    this.charts.push(chart);
  }

  private initBudgetChart(): void {
    const items = this.budgetSvc.items();
    const categoryTotals = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + (item.actualCost ?? item.estimatedCost);
      return acc;
    }, {} as Record<string, number>);

    const ctx = this.budgetChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(categoryTotals).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        datasets: [{
          label: 'Cost (€)',
          data: Object.values(categoryTotals),
          backgroundColor: 'rgba(139, 74, 98, 0.7)',
          borderColor: '#8b4a62',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: 'rgba(255,255,255,0.6)', callback: (v: any) => '€' + v },
            grid: { color: 'rgba(255,255,255,0.08)' },
          },
          x: {
            ticks: { color: 'rgba(255,255,255,0.6)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
          },
        },
      },
    });
    this.charts.push(chart);
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = { urgent: 'warn', high: 'accent', medium: '', low: '' };
    return map[priority] ?? '';
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }
}
