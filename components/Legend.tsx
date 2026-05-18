
import React from 'react';

const LegendItem: React.FC<{ color: string; label: string; range: string }> = ({ color, label, range }) => (
    <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
        <div className={`w-4 h-4 rounded-full ${color}`}></div>
        <div className="flex flex-col">
            <span className="font-black text-[10px] text-slate-800 uppercase tracking-tight leading-none">{label}</span>
            <span className="text-slate-500 text-[9px] font-bold">{range}</span>
        </div>
    </div>
);

const Legend: React.FC = () => {
    return (
        <div className="bg-slate-50 p-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                 <span className="font-black text-[10px] text-slate-500 uppercase tracking-widest mr-2">Referencia de Estados:</span>
                <LegendItem color="bg-emerald-600" label="EN ESTADO OPTIMO" range="71% - 100%" />
                <LegendItem color="bg-amber-500" label="PROXIMO A DAR AVISO" range="70%" />
                <LegendItem color="bg-rose-600" label="NECESITA RECARGA" range="0% - 69%" />
            </div>
        </div>
    );
};

export default Legend;
