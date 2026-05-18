
import React, { useState, useEffect } from 'react';
import { FuelLoad, StoredGenerator } from '../types';

interface FuelManagementViewProps {
    generators: StoredGenerator[];
    fuelLoads: FuelLoad[];
    onAddLoad: (genId: number, liters: string, date: string, operator: string) => void;
    onDeleteLoad: (id: string) => void;
    defaultOperator: string;
}

const FuelManagementView: React.FC<FuelManagementViewProps> = ({ generators, fuelLoads, onAddLoad, onDeleteLoad, defaultOperator }) => {
    const [selectedGenId, setSelectedGenId] = useState<number | ''>('');
    const [liters, setLiters] = useState('');
    const [date, setDate] = useState(new Date().toLocaleDateString('es-ES'));
    const [operator, setOperator] = useState(defaultOperator);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; stage: 0 | 1 | 2 }>({ id: '', stage: 0 });

    useEffect(() => {
        setOperator(defaultOperator);
    }, [defaultOperator]);

    const handleSave = () => {
        if (!selectedGenId || !liters || !operator) {
            alert("Por favor complete todos los campos, incluyendo el operador.");
            return;
        }
        onAddLoad(Number(selectedGenId), liters, date, operator);
        setLiters('');
    };

    const handleDeleteClick = (id: string) => {
        if (confirmDelete.id === id) {
            if (confirmDelete.stage === 1) {
                setConfirmDelete({ id, stage: 2 });
            } else if (confirmDelete.stage === 2) {
                onDeleteLoad(id);
                setConfirmDelete({ id: '', stage: 0 });
            }
        } else {
            setConfirmDelete({ id, stage: 1 });
        }
    };

    const selectedGen = generators.find(g => g.id === selectedGenId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de Carga */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    REGISTRAR CARGA
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Operador Responsable:</label>
                        <input 
                            type="text" 
                            value={operator}
                            onChange={(e) => setOperator(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                            placeholder="Nombre del operador"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Seleccionar Generador:</label>
                        <select 
                            value={selectedGenId}
                            onChange={(e) => setSelectedGenId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-white text-slate-900 border border-slate-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">-- Seleccionar --</option>
                            {generators.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>

                    {selectedGen && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Estado Actual:</span>
                                <span className="text-xs font-black text-slate-700">{selectedGen.fuelLevel}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${selectedGen.fuelLevel}%` }} />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2">Capacidad: {selectedGen.tankCapacity}</p>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Litros Recargados:</label>
                        <input 
                            type="text" 
                            placeholder="Ej: 100"
                            value={liters}
                            onChange={(e) => setLiters(e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Fecha de Carga:</label>
                        <input 
                            type="text" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all"
                    >
                        Guardar Registro
                    </button>
                </div>
            </div>

            {/* Historial de Cargas */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">HISTORIAL DE CARGAS</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left">Generador / Responsable</th>
                                <th className="px-6 py-4 text-center">Litros</th>
                                <th className="px-6 py-4 text-center">Fecha</th>
                                <th className="px-6 py-4 text-center">Nivel Resultante</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {fuelLoads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No hay registros de carga.</td>
                                </tr>
                            ) : (
                                fuelLoads.map((load) => (
                                    <tr key={load.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{load.generatorName}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase italic">Por: {load.operator}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-indigo-600">{load.liters} L</td>
                                        <td className="px-6 py-4 text-center text-slate-600 font-mono">{load.date}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-[10px] text-slate-400">{load.previousLevel}%</span>
                                                <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                <span className="font-black text-emerald-600">{load.newLevel}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    onClick={() => handleDeleteClick(load.id)}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm ${
                                                        confirmDelete.id === load.id 
                                                            ? confirmDelete.stage === 1 
                                                                ? 'bg-amber-500 text-white' 
                                                                : 'bg-red-600 text-white'
                                                            : 'bg-slate-100 text-slate-400 hover:text-red-500'
                                                    }`}
                                                >
                                                    {confirmDelete.id === load.id 
                                                        ? confirmDelete.stage === 1 ? '¿Confirmar?' : '¡ELIMINAR!'
                                                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    }
                                                </button>
                                                {confirmDelete.id === load.id && (
                                                    <button 
                                                        onClick={() => setConfirmDelete({ id: '', stage: 0 })}
                                                        className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase"
                                                    >
                                                        X
                                                    </button>
                                                )}
                                            </div>
                                        </td>
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

export default FuelManagementView;
