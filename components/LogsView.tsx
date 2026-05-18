
import React from 'react';
import { ChangeLog } from '../types';

interface LogsViewProps {
  logs: ChangeLog[];
}

const LogsView: React.FC<LogsViewProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">HISTORIAL DE CAMBIOS</h2>
          <p className="text-slate-500 text-sm">Registro de actualizaciones manuales, automáticas e IA</p>
        </div>
        <button 
          onClick={() => {
            const csv = "Fecha,Generador,Campo,Anterior,Nuevo,Origen,Operador\n" + 
              logs.map(l => `${new Date(l.timestamp).toLocaleString()},${l.generatorName},${l.field},${l.oldValue},${l.newValue},${l.source},${l.operator}`).join("\n");
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `reporte_cambios_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
          }}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-700 transition-colors shadow-lg"
        >
          Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Fecha/Hora</th>
              <th className="px-6 py-4 text-left">Generador / Operador</th>
              <th className="px-6 py-4 text-left">Campo</th>
              <th className="px-6 py-4 text-right">Anterior</th>
              <th className="px-6 py-4 text-right">Nuevo</th>
              <th className="px-6 py-4 text-center">Origen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold italic uppercase">No hay cambios registrados aún.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap font-mono text-xs">
                    {new Date(log.timestamp).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-800 uppercase text-xs">{log.generatorName}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase">👤 {log.operator || 'Operador NOC'}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500 uppercase font-black text-[10px]">
                    {log.field === 'fuelLevel' ? 'Combustible' : log.field === 'executionHours' ? 'Horas' : log.field}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 font-bold">{log.oldValue}</td>
                  <td className="px-6 py-4 text-right font-black text-red-600">{log.newValue}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      log.source === 'AI' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                      log.source === 'Outage' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      log.source === 'Excel' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {log.source}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsView;
