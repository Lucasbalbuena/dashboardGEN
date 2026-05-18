
import React from 'react';

interface HeaderProps {
    onAddGenerator: () => void;
    onFileUpload: (file: File) => void;
    onGoogleSheetImportClick: () => void;
    onScanClick: () => void;
    controlDate: Date;
    onControlDateChange: (date: string) => void;
    onSaveSessionCapture: () => void;
    onDownloadJPG: () => void;
    isHistoryView: boolean;
    onReturnToLive: () => void;
    view: 'dashboard' | 'reports' | 'logs' | 'fuel' | 'outages' | 'scanner';
    onToggleView: (view: 'dashboard' | 'reports' | 'logs' | 'fuel' | 'outages' | 'scanner') => void;
    currentOperator: string;
    onOperatorChange: (name: string) => void;
    onResetData: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onAddGenerator, 
    controlDate, 
    onControlDateChange, 
    onDownloadJPG,
    onScanClick,
    view,
    onToggleView,
    currentOperator,
    onOperatorChange,
    onResetData
}) => {
    return (
        <header className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800 print:hidden">
            <div className="p-4 md:p-6 bg-gradient-to-r from-slate-900 to-slate-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">G</span>
                            SISTEMA DE GENERADORES <span className="text-red-500 font-normal">v3.1</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">Panel Automatizado de Monitoreo</p>
                    </div>

                    <div className="flex flex-wrap gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                        <button 
                          onClick={() => onToggleView('dashboard')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'hover:bg-slate-700 text-slate-400'}`}
                        >
                          Dashboard
                        </button>
                        <button 
                          onClick={() => onToggleView('scanner')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'scanner' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-700 text-slate-400'}`}
                        >
                          Escáner
                        </button>
                        <button 
                          onClick={() => onToggleView('outages')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'outages' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'hover:bg-slate-700 text-slate-400'}`}
                        >
                          Cortes Energía
                        </button>
                        <button 
                          onClick={() => onToggleView('fuel')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'fuel' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-700 text-slate-400'}`}
                        >
                          Carga Fuel
                        </button>
                        <button 
                          onClick={() => onToggleView('reports')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'reports' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'hover:bg-slate-700 text-slate-400'}`}
                        >
                          Reportes
                        </button>
                        <button 
                          onClick={() => onToggleView('logs')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'logs' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'hover:bg-slate-700 text-slate-400'}`}
                        >
                          Logs
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={onScanClick}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg uppercase tracking-tight"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Sincronizar
                        </button>

                        <button 
                            onClick={onDownloadJPG}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg uppercase tracking-tight"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Captura
                        </button>

                        <button 
                            onClick={onAddGenerator}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all"
                        >
                            + Nuevo
                        </button>

                        <button 
                            onClick={onResetData}
                            className="bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl font-bold transition-all border border-slate-700"
                            title="Restablecer Datos Iniciales"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="px-6 py-3 bg-slate-800/30 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Operador de Turno:</span>
                <input
                    type="text"
                    value={currentOperator}
                    onChange={(e) => onOperatorChange(e.target.value)}
                    placeholder="Nombre del Operador"
                    className="bg-slate-900/50 text-white rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-red-500/30 outline-none w-48"
                />
              </div>

              {(view === 'dashboard' || view === 'fuel' || view === 'outages') && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Fecha Control:</span>
                  <input
                      type="date"
                      value={controlDate.toISOString().split('T')[0]}
                      onChange={(e) => onControlDateChange(e.target.value)}
                      className="bg-slate-900/50 text-white rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-bold"
                  />
                </div>
              )}
            </div>
        </header>
    );
};

export default Header;
