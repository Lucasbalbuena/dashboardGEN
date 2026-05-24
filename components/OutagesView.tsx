
import React, { useState, useEffect } from 'react';
import { Outage, StoredGenerator } from '../types';

interface OutagesViewProps {
    generators: StoredGenerator[];
    outages: Outage[];
    onAddOutage: (genId: number, date: string, start: string, end: string, operator: string) => void;
    onSetOutageEnd: (outageId: string, endTime: string) => void;
    onDeleteOutage: (id: string) => void;
    defaultOperator: string;
    isReadOnly?: boolean;
}

const OutagesView: React.FC<OutagesViewProps> = ({ generators, outages, onAddOutage, onSetOutageEnd, onDeleteOutage, defaultOperator, isReadOnly }) => {
    const [selectedGenId, setSelectedGenId] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [start, setStart] = useState('08:00');
    const [end, setEnd] = useState('');
    const [operator, setOperator] = useState(defaultOperator);
    const [editingOutageId, setEditingOutageId] = useState<string | null>(null);
    const [tempEndTime, setTempEndTime] = useState('');

    useEffect(() => {
        setOperator(defaultOperator);
    }, [defaultOperator]);

    const handleSave = () => {
        if (!selectedGenId || !date || !start || !operator) {
            alert("Por favor complete los campos obligatorios: Generador, Fecha, Inicio y Operador.");
            return;
        }
        onAddOutage(Number(selectedGenId), date, start, end, operator);
        setEnd('');
    };

    const handleRestoreOutage = (id: string) => {
        if (!tempEndTime) {
            alert("Ingrese la hora de restablecimiento.");
            return;
        }
        onSetOutageEnd(id, tempEndTime);
        setEditingOutageId(null);
        setTempEndTime('');
    };

    const selectedGen = generators.find(g => g.id === selectedGenId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
           {/* Formulario de Registro de Corte */}
{!isReadOnly && (
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Registro de Corte</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Operador Responsable:</label>
                        <input 
                            type="text" 
                            value={operator}
                            onChange={(e) => setOperator(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                            placeholder="Nombre del operador"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 text-slate-400">Generador Afectado:</label>
                        <select 
                            value={selectedGenId}
                            onChange={(e) => setSelectedGenId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                        >
                            <option value="" className="text-slate-400">-- Seleccionar --</option>
                            {generators.map(g => <option key={g.id} value={g.id} className="text-slate-900">{g.name}</option>)}
                        </select>
                    </div>

                    {selectedGen && (
                        <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black text-orange-600 uppercase">Capacidad: {selectedGen.tankCapacity} | Potencia: {selectedGen.powerKVA}</span>
                                <span className="text-xs font-black text-orange-700">{selectedGen.fuelLevel}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-orange-200 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${selectedGen.fuelLevel}%` }} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 text-slate-400">Fecha:</label>
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 text-slate-400">Inicio Corte:</label>
                            <input 
                                type="time" 
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 text-slate-400">Restablecimiento:</label>
                            <input 
                                type="time" 
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-2xl text-white">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cálculo Inteligente de Consumo:</p>
                        <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                            El sistema descuenta automáticamente combustible basado en las horas de operación, la potencia (KVA) y la capacidad del tanque del equipo.
                        </p>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-600/20 transition-all active:scale-95"
                    >
                        {end ? 'Registrar y Calcular Consumo' : 'Registrar Inicio'}
                    </button>
                </div>
            </div>
)}
            {/* Historial de Impacto */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Movimientos de Combustible por Cortes</h2>
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase">{outages.length} EVENTOS</span>
                </div>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left">Generador / Fecha</th>
                                <th className="px-6 py-4 text-center">Horario</th>
                                <th className="px-6 py-4 text-center">Duración</th>
                                <th className="px-6 py-4 text-center">Impacto Estimado</th>
                                {!isReadOnly && (
    <th className="px-6 py-4 text-right"></th>
)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {outages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            <p className="text-sm font-black uppercase italic">Sin eventos registrados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                outages.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((outage) => (
                                    <tr key={outage.id} className={`transition-colors group ${!outage.endTime ? 'bg-orange-50/30' : 'hover:bg-slate-50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-slate-800 uppercase text-xs">{outage.generatorName}</p>
                                                {!outage.endTime && <span className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></span>}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold">{new Date(outage.date).toLocaleDateString('es-ES')}</p>
                                            <p className="text-[9px] font-black text-orange-500 uppercase">Operador: {outage.operator}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {outage.endTime ? (
                                                <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-600">{outage.startTime} ➔ {outage.endTime}</span>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="px-2 py-1 bg-orange-100 rounded text-[10px] font-black text-orange-700">DESDE: {outage.startTime}</span>
                                                   {editingOutageId === outage.id ? (
    <div className="flex items-center gap-1 mt-1">
        <input 
            type="time" 
            className="text-[10px] p-1 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-orange-500"
            value={tempEndTime}
            onChange={(e) => setTempEndTime(e.target.value)}
        />

        <button 
            onClick={() => handleRestoreOutage(outage.id)}
            className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-500 transition-colors shadow-sm"
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        </button>

        <button 
            onClick={() => setEditingOutageId(null)}
            className="bg-slate-200 text-slate-600 p-1 rounded hover:bg-slate-300 transition-colors"
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
) : (
    !isReadOnly && (
        <button 
            onClick={() => setEditingOutageId(outage.id)}
            className="text-[9px] font-black text-indigo-600 underline hover:text-indigo-800 uppercase tracking-tight"
        >
            Cerrar Corte
        </button>
    )
)}
                                    </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                                            {outage.endTime ? `${outage.durationHours.toFixed(2)} Hr` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {outage.endTime ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-rose-600 text-xs">{outage.litersDeducted} Lts ({outage.fuelDeducted}%)</span>
                                                    <div className="w-16 h-1 bg-rose-100 rounded-full overflow-hidden mt-1">
                                                        <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, outage.fuelDeducted)}%` }} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 italic uppercase">Cálculo Pendiente</span>
                                            )}
                                        </td>
                                       {!isReadOnly && (
<td className="px-6 py-4 text-right">
        <button 
            onClick={() => onDeleteOutage(outage.id)}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-2"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
   </td>
)}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OutagesView;
