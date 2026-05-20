
import React from 'react';
import { Generator, Status, SortConfig } from '../types';

interface GeneratorTableProps {
  generators: Generator[];
  onSort: (key: keyof Generator) => void;
  sortConfig: SortConfig;
  selectedRowId: number | null;
  onRowClick: (id: number) => void;
  editingCell: { id: number; key: keyof Generator } | null;
  onCellDoubleClick: (id: number, key: keyof Generator) => void;
  onUpdate: (id: number, key: keyof Generator, value: string) => void;
  onCancelEdit: () => void;
  onEdit: (gen: Generator) => void;
  onDelete: (id: number) => void;
  isReadOnly: boolean;
}

const getStatusClass = (status: Status): string => {
  switch (status) {
    case Status.Optimal:
      return 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
    case Status.NeedsRecharge:
      return 'bg-rose-600 text-white border-rose-700 shadow-sm';
    case Status.Warning:
      return 'bg-amber-500 text-white border-amber-600 shadow-sm';
    default:
      return 'bg-slate-400 text-white';
  }
};

const formatearUltimaCarga = (valor: string) => {
  if (!valor) return "-";
  
  // Si ya viene formateado DD/MM/YYYY (por inputs manuales previos)
  if (valor.includes('/') && !valor.includes('T') && !valor.includes('-')) {
    return valor;
  }

  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return valor;

  return fecha.toLocaleDateString("es-AR") + "\n" +
         fecha.toLocaleTimeString("es-AR", {
           hour: "2-digit",
           minute: "2-digit"
         }) + " hs";
};

const GeneratorTable: React.FC<GeneratorTableProps> = ({ generators, onSort, sortConfig, onRowClick, selectedRowId, editingCell, onCellDoubleClick, onUpdate, onEdit, onDelete }) => {
  const headers: { label: string; key: keyof Generator }[] = [
  { label: 'Ubicación / Nombre', key: 'name' },
  { label: 'N° de Serie', key: 'serialNumber' },
  { label: 'Potencia', key: 'powerKVA' },
  { label: 'Horas Ej.', key: 'executionHours' },
  { label: 'Capacidad de Combustible', key: 'tankCapacity' },
  { label: 'Estado Nivel de Combustible (%)', key: 'fuelLevel' },
  { label: 'Estado', key: 'status' },
  { label: 'Voltaje', key: 'batteryVoltage' },
  { label: 'Fecha de Modificación', key: 'lastRechargeDate' }
];

  const inputBaseClass = "bg-white text-slate-900 border border-indigo-500 p-1.5 rounded shadow-sm outline-none focus:ring-2 focus:ring-indigo-300 font-bold block w-full";

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-slate-100 border-b border-slate-300">
          {headers.map((h) => (
            <th 
              key={h.key} 
              onClick={() => onSort(h.key)}
              className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-600 cursor-pointer hover:text-red-600 transition-colors"
            >
              <div className="flex items-center gap-1">
                {h.label}
                {sortConfig.key === h.key && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </div>
            </th>
          ))}
          <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-600">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {generators.map((g) => {
          return (
            <tr 
              key={g.id} 
              onClick={() => onRowClick(g.id)}
              className={`group transition-all ${selectedRowId === g.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              <td className="px-6 py-4 font-bold text-slate-900" onDoubleClick={() => onCellDoubleClick(g.id, 'name')}>
                {editingCell?.id === g.id && editingCell.key === 'name' ? (
                  <input autoFocus onBlur={(e) => onUpdate(g.id, 'name', e.target.value)} defaultValue={g.name} className={inputBaseClass} />
                ) : g.name}
              </td>
              <td className="px-6 py-4 text-[10px] font-mono text-slate-500" onDoubleClick={() => onCellDoubleClick(g.id, 'serialNumber')}>
                {editingCell?.id === g.id && editingCell.key === 'serialNumber' ? (
                  <input autoFocus onBlur={(e) => onUpdate(g.id, 'serialNumber', e.target.value)} defaultValue={g.serialNumber || ''} className={`${inputBaseClass} w-24`} />
                ) : g.serialNumber || '-'}
              </td>
              <td className="px-6 py-4 text-indigo-600 font-black" onDoubleClick={() => onCellDoubleClick(g.id, 'powerKVA')}>
                {editingCell?.id === g.id && editingCell.key === 'powerKVA' ? (
                  <input autoFocus onBlur={(e) => onUpdate(g.id, 'powerKVA', e.target.value)} defaultValue={g.powerKVA} className={`${inputBaseClass} w-24`} />
                ) : g.powerKVA}
              </td>
              <td className="px-6 py-4 text-slate-700 font-mono font-medium" onDoubleClick={() => onCellDoubleClick(g.id, 'executionHours')}>
                {editingCell?.id === g.id && editingCell.key === 'executionHours' ? (
                  <input autoFocus onBlur={(e) => onUpdate(g.id, 'executionHours', e.target.value)} defaultValue={g.executionHours} className={`${inputBaseClass} w-24`} />
                ) : g.executionHours}
              </td>
              <td className="px-6 py-4 text-slate-700 font-bold" onDoubleClick={() => onCellDoubleClick(g.id, 'tankCapacity')}>
                {editingCell?.id === g.id && editingCell.key === 'tankCapacity' ? (
                  <input autoFocus type="text" onBlur={(e) => onUpdate(g.id, 'tankCapacity', e.target.value)} defaultValue={g.tankCapacity} className={`${inputBaseClass} w-24`} />
                ) : g.tankCapacity}
              </td>
              <td className="px-6 py-4" onDoubleClick={() => onCellDoubleClick(g.id, 'fuelLevel')}>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div className={`h-full ${g.fuelLevel < 30 ? 'bg-rose-500' : g.fuelLevel < 71 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${g.fuelLevel}%` }} />
                  </div>
                  {editingCell?.id === g.id && editingCell.key === 'fuelLevel' ? (
                    <input autoFocus type="number" onBlur={(e) => onUpdate(g.id, 'fuelLevel', e.target.value)} defaultValue={g.fuelLevel} className={`${inputBaseClass} w-20`} />
                  ) : <span className="text-xs font-black text-slate-900">{g.fuelLevel}%</span>}
                </div>
              </td>
               <td className="px-6 py-4">
                <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getStatusClass(g.status)}`}>
                  {g.status}
                </span>
              </td>
              <td className="px-6 py-4 text-amber-600 font-black text-xs" onDoubleClick={() => onCellDoubleClick(g.id, 'batteryVoltage')}>
                {editingCell?.id === g.id && editingCell.key === 'batteryVoltage' ? (
                  <input autoFocus onBlur={(e) => onUpdate(g.id, 'batteryVoltage', e.target.value)} defaultValue={g.batteryVoltage || ''} className={`${inputBaseClass} w-20`} />
                ) : g.batteryVoltage || '-'}
              </td>
              
              <td 
                className="px-6 py-4 text-slate-700 text-sm font-semibold whitespace-pre-line" 
                onDoubleClick={() => onCellDoubleClick(g.id, 'lastRechargeDate')}
              >
                {editingCell?.id === g.id && editingCell.key === 'lastRechargeDate' ? (
                  <input 
                    autoFocus 
                    onBlur={(e) => onUpdate(g.id, 'lastRechargeDate', e.target.value)} 
                    defaultValue={g.lastRechargeDate.includes('T') ? new Date(g.lastRechargeDate).toLocaleDateString('es-AR') : g.lastRechargeDate} 
                    placeholder="DD/MM/YYYY"
                    className={`${inputBaseClass} w-32`} 
                  />
                ) : formatearUltimaCarga(g.lastRechargeDate)}
              </td>
              <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(g); }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default GeneratorTable;
