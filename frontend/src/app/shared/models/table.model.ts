export type TableShape = 'round' | 'rectangular' | 'oval';

export interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  shape: TableShape;
  guestIds: string[];
  notes?: string;
  positionX?: number;
  positionY?: number;
}
