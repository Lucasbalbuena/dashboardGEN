
import React, { useState, useMemo } from 'react';
import { Report, ReportEntry } from '../types';

interface ReportTableProps {
    report: Report;
    onAddEntry: () => void;
    onUpdateEntry: (entryId: number, key: keyof ReportEntry, value: string) => void;
    onDeleteEntry: (entryId: number) => void;
}

const timeStringToHours = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h + m / 60;
};

const decimalHoursToTime = (decimalHours: number): string => {
    if (isNaN(decimalHours) || decimalHours < 0) return '0:00';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${String(minutes).padStart(2, '0')}`;
};

const ReportTable: React.FC<ReportTableProps> = ({ report, onAddEntry, onUpdateEntry, onDeleteEntry }) => {
    const [editingCell, setEditingCell] = useState<{ entryId: number; key: keyof ReportEntry } | null>(null);

    const processedEntries = useMemo(() => {
        let accumulatedHours = 0;
        return report.entries.map(entry => {
            const hIn = timeStringToHours(entry.hIn);
            const hFin = timeStringToHours(entry.hFin);
            const tdfHs = hFin >= hIn ? hFin - hIn : 0;
            accumulatedHours += tdfHs;
            return { ...entry, tdfHs, accumulatedHours };
        });
    }, [report.entries]);

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border print:border-slate-300">
            <div className={`p-4 flex justify-between items-center ${report.isFinalized ? 'bg-slate-800' : 'bg-red-600'}`}>
                <h2 className="font-black text-white text-lg tracking-tight uppercase">
                    {report.generatorName} - PERÍODO: {report.month}
                </h2>
                {report.isFinalized && (
                  <span className="bg-white/20 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/30">
                    Mes Archivado
                  </span>
                )}
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-3 border-r border-slate-200 text-center">Nº</th>
                            <th className="px-3 py-3 border-r border-slate-200">LOCALIDAD</th>
                            <th className="px-3 py-3 border-r border-slate-200">FECHA CARGA</th>
                            <th className="px-3 py-3 border-r border-slate-200 text-center">FUNCIONAMIENTO</th>
                            <th className="px-3 py-3 border-r border-slate-200 text-center">H IN</th>
                            <th className="px-3 py-3 border-r border-slate-200 text-center">H FIN</th>
                            <th className="px-3 py-3 border-r border-slate-200 text-center bg-slate-100">TDF HS</th>
                            <th className="px-3 py-3 border-r border-slate-200 text-center bg-slate-100 font-black">AUTONOMÍA %</th>
                            {!report.isFinalized && <th className="px-3 py-3 text-center print:hidden">ELIMINAR</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedEntries.map(entry => (
                            <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-3 py-3 border-r border-slate-100 text-center font-bold text-slate-400">{entry.n}</td>
                                <td className="px-3 py-3 border-r border-slate-100 font-bold text-slate-800 uppercase">{entry.geLocalidad}</td>
                                <td className="px-3 py-3 border-r border-slate-100 text-slate-600">{entry.fechaAltCarga}</td>
                                <td className="px-3 py-3 border-r border-slate-100 text-center font-black text-emerald-600 uppercase">{entry.entradaEnFuncionamiento}</td>
                                <td className="px-3 py-3 border-r border-slate-100 text-center font-mono text-slate-600">{entry.hIn}</td>
                                <td className="px-3 py-3 border-r border-slate-100 text-center font-mono text-slate-600">{entry.hFin}</td>
                                <td className="px-3 py-3 border-r border-slate-100 text-center font-black text-slate-500 bg-slate-50/50">{decimalHoursToTime(entry.tdfHs)}</td>
                                <td className="px-3 py-3 border-r border-slate-100 text-center font-black text-red-600 bg-red-50/30">{entry.autonomia}%</td>
                                {!report.isFinalized && (
                                  <td className="px-3 py-3 text-center print:hidden">
                                      <button 
                                          onClick={() => onDeleteEntry(entry.id)} 
                                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                  </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {!report.isFinalized && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end print:hidden">
                  <button 
                      onClick={onAddEntry}
                      className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-sm"
                  >
                      Agregar Fila Manual
                  </button>
              </div>
            )}
        </div>
    );
};

export default ReportTable;
