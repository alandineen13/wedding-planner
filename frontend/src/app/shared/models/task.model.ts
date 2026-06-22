export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory =
  | 'venue'
  | 'catering'
  | 'invitations'
  | 'attire'
  | 'photography'
  | 'entertainment'
  | 'flowers'
  | 'transport'
  | 'accommodation'
  | 'legal'
  | 'budget'
  | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  assignedTo?: string;
  supplierId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
