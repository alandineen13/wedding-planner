export type SupplierCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'florist'
  | 'entertainment'
  | 'attire'
  | 'hair_makeup'
  | 'cake'
  | 'transport'
  | 'accommodation'
  | 'other';

export type ContractStatus = 'none' | 'pending' | 'signed';

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  contractStatus: ContractStatus;
  contractUrl?: string;
  totalCost?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  balanceDue?: number;
  balanceDueDate?: string;
  notes?: string;
  rating?: number;
  createdAt: string;
}
