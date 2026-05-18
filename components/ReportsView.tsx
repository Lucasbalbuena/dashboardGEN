
import React, { useState, useMemo } from 'react';
import { Report, ReportEntry, StoredGenerator } from '../types';
import ReportTable from './ReportTable';

interface ReportsViewProps {
    reports: Report[];
    generators: StoredGenerator[];
    currentMonth: string;
    onMonthChange: (month: string) => void;
    onFinalizeMonth: (month: string) => void;
    onAddEntry: (reportId: string) => void;
    onUpdateEntry: (reportId: string, entryId: number, key: keyof ReportEntry, value: string) => void;
    onDeleteEntry: (reportId: string, entryId: number) => void;
    onAddReport: (generatorName: string) => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({ 
    reports, 
    generators, 
    currentMonth, 
    onMonthChange, 
    onFinalizeMonth,
    onAddEntry, 
    onUpdateEntry, 
    onDeleteEntry, 
    onAddReport 
}) => {
    const [selectedGeneratorToAdd, setSelectedGeneratorToAdd] = useState('');

    const filteredReports = useMemo(() => {
        return reports.filter(r => r.month === currentMonth);
    }, [reports, currentMonth]);

    const generatorsWithReportThisMonth = useMemo(() => new Set(filteredReports.map(r => r.generatorName)), [filteredReports]);
    
    const generatorsWithoutReportThisMonth = useMemo(() => 
        generators.filter(g => !generatorsWithReportThisMonth.has(g.name))
    , [generators, generatorsWithReportThisMonth]);

    const handleAddClick = () => {
        if (selectedGeneratorToAdd) {
            onAddReport(selectedGeneratorToAdd);
            setSelectedGeneratorToAdd('');
        }
    };

    const isMonthFinalized = useMemo(() => {
        return filteredReports.length > 0 && filteredReports.every(r => r.isFinalized);
    }, [filteredReports]);

    return (
        <div className="space-y-8 mt-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 flex flex-wrap items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Período Mensual:</label>
                        <input 
                            type="month" 
                            value={currentMonth} 
                            onChange={(e) => onMonthChange(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>
                    {isMonthFinalized ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-black">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.48V12" /></svg>
                         MES CERRADO Y ARCHIVADO
                      </div>
                    ) : (
                      <button 
                        onClick={() => onFinalizeMonth(currentMonth)}
                        className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-red-600 transition-all shadow-lg"
                      >
                        Finalizar Período
                      </button>
                    )}
                </div>

                {!isMonthFinalized && generatorsWithoutReportThisMonth.length > 0 && (
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedGeneratorToAdd}
                            onChange={(e) => setSelectedGeneratorToAdd(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                        >
                            <option value="">+ Agregar Reporte...</option>
                            {generatorsWithoutReportThisMonth.map(g => (
                                <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleAddClick} 
                            disabled={!selectedGeneratorToAdd}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-bold text-sm"
                        >
                            Agregar
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-12">
                {filteredReports.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                        <p className="text-slate-400 font-bold italic">No hay reportes iniciados para este mes.</p>
                    </div>
                ) : (
                    filteredReports.sort((a,b) => a.generatorName.localeCompare(b.generatorName)).map(report => (
                        <ReportTable 
                            key={report.id}
                            report={report}
                            onAddEntry={() => onAddEntry(report.id)}
                            onUpdateEntry={(entryId, key, val) => onUpdateEntry(report.id, entryId, key, val)}
                            onDeleteEntry={(entryId) => onDeleteEntry(report.id, entryId)}
                        />
                    ))
                )}
            </div>

            {/* Información Técnica Adicional Solicitada */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800 print:bg-slate-100 print:text-slate-900 print:shadow-none">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-red-500 print:bg-slate-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Rectificador Itaembé Guazú</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Configuración de Red y Acceso</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 print:border-slate-300">
                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">IP Address</span>
                    <span className="text-xs font-mono font-bold tracking-widest">10.1.151.11</span>
                  </div>
                  <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 print:border-slate-300">
                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Password</span>
                    <span className="text-xs font-mono font-bold tracking-widest">2016</span>
                  </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
