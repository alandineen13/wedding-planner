export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'flowers'
  | 'entertainment'
  | 'attire'
  | 'accommodation'
  | 'transport'
  | 'stationery'
  | 'hair_makeup'
  | 'cake'
  | 'rings'
  | 'honeymoon'
  | 'other';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'partially_paid' | 'paid';

export interface BudgetItem {
  id: string;
  name: string;
  category: BudgetCategory;
  estimatedCost: number;
  actualCost?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  paymentStatus: PaymentStatus;
  supplierId?: string;
  notes?: string;
  dueDate?: string;
  createdAt: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  totalOutstanding: number;
  variance: number;
}
