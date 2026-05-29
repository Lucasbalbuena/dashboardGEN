
export enum Status {
  Optimal = 'ÓPTIMO',
  Normal = 'NORMAL',
  NeedsRecharge = 'RECARGAR',
  Warning = 'AVISO',
}

export interface Outage {
  id: string;
  generatorId: number;
  generatorName: string;
  serial?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  fuelDeducted: number; // Porcentaje
  litersDeducted: number; // Litros físicos consumidos
  operator: string;
}

export interface FuelLoad {
  id: string;
  generatorId: number;
  generatorName: string;
  liters: string;
  date: string;
  previousLevel: number;
  newLevel: number;
  operator: string;
}

export interface Generator {
  id: number;
  name: string;

  executionHours: string;

  fuelLevel: number;
  tankCapacity: string;

  powerKVA: string;

  serialNumber?: string;
  batteryVoltage?: string;

  lastRechargeLiters: string;

  status: Status;

  lastRechargeDate: string;
  timeSinceLastRecharge: number;

  operator?: string;

  // Tickets
  ticket?: string;
  ticketUrl?: string;
  ticketStatus?: string;
  ticketPriority?: string;
  ticketDescription?: string;
}

export type StoredGenerator = Omit<Generator, 'status' | 'timeSinceLastRecharge'>;

export interface SortConfig {
  key: keyof Generator;
  direction: 'ascending' | 'descending';
}

export interface ReportEntry {
  id: number;
  n: string;
  geLocalidad: string;
  fechaAltCarga: string;
  entradaEnFuncionamiento: string;
  hIn: string;
  hFin: string;
  tdfHs: string;
  autonomia: string;
  timestamp: string; 
  operator?: string;
}

export interface Report {
  id: string;
  generatorName: string;
  month: string; 
  isFinalized: boolean;
  entries: ReportEntry[];
}

export interface ChangeLog {
  id: string;
  timestamp: string;
  generatorName: string;
  field: string;
  oldValue: string | number;
  newValue: string | number;
  // Added 'OCR' and 'AI' to source to allow logging of changes originating from OCR scanning processes
  source: 'Manual' | 'Excel' | 'Outage' | 'OCR' | 'AI';
  operator: string;
}
