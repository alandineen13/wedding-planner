import { Component, inject, computed, ElementRef, AfterViewInit, OnDestroy, ViewChild, DestroyRef, Injector } from '@angular/core';
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
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, TitleCasePipe, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatChipsModule, MatDividerModule, MatListModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rsvpChart')   rsvpChartRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('budgetChart') budgetChartRef!: ElementRef<HTMLCanvasElement>;

  private guestSvc   = inject(GuestService);
  private budgetSvc  = inject(BudgetService);
  private taskSvc    = inject(TaskService);
  private seatingSvc = inject(SeatingService);
  private authSvc    = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private injector   = inject(Injector);

  private rsvpChart:   Chart | null = null;
  private budgetChart: Chart | null = null;

  readonly user          = this.authSvc.user;
  readonly guestStats    = this.guestSvc.stats;
  readonly budgetSummary = this.budgetSvc.summary;
  readonly taskStats     = this.taskSvc.stats;
  readonly seatingStats  = this.seatingSvc.stats;

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
    const s = this.taskStats();
    return s.total ? Math.round((s.completed / s.total) * 100) : 0;
  });

  readonly budgetUsedPct = computed(() => {
    const s = this.budgetSummary();
    if (!s.totalBudget) return 0;
    return Math.min(100, Math.round((s.totalActual / s.totalBudget) * 100));
  });

  ngAfterViewInit(): void {
    // Create chart skeletons immediately (empty data)
    this.rsvpChart   = this.buildRsvpChart([0, 0, 0, 0]);
    this.budgetChart = this.buildBudgetChart([], []);

    // Push real data into the charts as soon as each signal updates
    toObservable(this.guestSvc.stats, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(stats => {
        if (!this.rsvpChart) return;
        this.rsvpChart.data.datasets[0].data = [
          stats.confirmed, stats.declined, stats.pending, stats.maybe,
        ];
        this.rsvpChart.update();
      });

    toObservable(this.budgetSvc.items, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        if (!this.budgetChart) return;
        const totals = items.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] ?? 0) + (item.actualCost ?? item.estimatedCost);
          return acc;
        }, {} as Record<string, number>);
        this.budgetChart.data.labels   = Object.keys(totals).map(k => this.formatCategory(k));
        this.budgetChart.data.datasets[0].data = Object.values(totals);
        this.budgetChart.update();
      });
  }

  ngOnDestroy(): void {
    this.rsvpChart?.destroy();
    this.budgetChart?.destroy();
  }

  private buildRsvpChart(data: number[]): Chart {
    const ctx = this.rsvpChartRef.nativeElement.getContext('2d')!;
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Confirmed', 'Declined', 'Pending', 'Maybe'],
        datasets: [{
          data,
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
  }

  private buildBudgetChart(labels: string[], data: number[]): Chart {
    const ctx = this.budgetChartRef.nativeElement.getContext('2d')!;
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cost (€)',
          data,
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
            ticks: {
              color: 'rgba(255,255,255,0.6)',
              callback: (v: any) => '€' + Number(v).toLocaleString(),
            },
            grid: { color: 'rgba(255,255,255,0.08)' },
          },
          x: {
            ticks: { color: 'rgba(255,255,255,0.6)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
          },
        },
      },
    });
  }

  private formatCategory(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
