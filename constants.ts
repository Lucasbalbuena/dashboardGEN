
import { StoredGenerator } from './types';

export const INITIAL_GENERATORS: StoredGenerator[] = [
  { id: 1, name: 'San Jose', executionHours: '0', fuelLevel: 100, tankCapacity: '70 Lts', powerKVA: '22KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 2, name: 'Oberá', executionHours: '0', fuelLevel: 100, tankCapacity: '40 Lts', powerKVA: '22KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 3, name: 'Jardín América', executionHours: '0', fuelLevel: 100, tankCapacity: '50 Lts', powerKVA: '22KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 4, name: 'L. N. Alem', executionHours: '0', fuelLevel: 100, tankCapacity: '25 Lts', powerKVA: '10KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 5, name: 'Rivadavia 1435 GE Verde', executionHours: '0', fuelLevel: 100, tankCapacity: '120 Lts', powerKVA: '63 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 6, name: 'Rivadavia 1435 GE Blanco', executionHours: '0', fuelLevel: 100, tankCapacity: '120 Lts', powerKVA: '110 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 7, name: 'Parque tecnológico', executionHours: '0', fuelLevel: 100, tankCapacity: '70 Lts', powerKVA: '22 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 8, name: 'A. del Valle', executionHours: '0', fuelLevel: 100, tankCapacity: '70 Lts', powerKVA: '22 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 9, name: 'Perkis S. Vicen', executionHours: '484', fuelLevel: 77, tankCapacity: '70 Lts', powerKVA: '22 KVA', lastRechargeLiters: '0', lastRechargeDate: '29/03/2026', serialNumber: '21130DA3', batteryVoltage: '13.6 V' },
  { id: 10, name: 'San Pedro', executionHours: '0', fuelLevel: 100, tankCapacity: '60 Lts', powerKVA: '22 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 11, name: 'B. Irigoyen', executionHours: '0', fuelLevel: 100, tankCapacity: '35 Lts', powerKVA: '13 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 12, name: 'C. Andresito', executionHours: '0', fuelLevel: 100, tankCapacity: '70 Lts', powerKVA: '22 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 13, name: 'Iguazu', executionHours: '0', fuelLevel: 100, tankCapacity: '50 Lts', powerKVA: '22 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 14, name: 'Apostoles', executionHours: '0', fuelLevel: 100, tankCapacity: '55 Lts', powerKVA: '10 KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 15, name: 'Wanda', executionHours: '0', fuelLevel: 100, tankCapacity: '0 Lts', powerKVA: '-', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 16, name: 'Eldorado', executionHours: '0', fuelLevel: 100, tankCapacity: '0 Lts', powerKVA: '-', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
  { id: 17, name: 'Parque industrial', executionHours: '0', fuelLevel: 100, tankCapacity: '0 Lts', powerKVA: '110KVA', lastRechargeLiters: '0', lastRechargeDate: '27/10/2025' },
];

export const EXCEL_GENERATORS = INITIAL_GENERATORS.map(g => g.name);
