import React from 'react';
import { ExternalLink, X } from 'lucide-react';

interface Props {
  selectedTicket: any;
  setSelectedTicket: any;
  onClose: () => void;
  isReadOnly: boolean;
}

const TicketPreviewPanel: React.FC<Props> = ({
  selectedTicket,
  setSelectedTicket,
  onClose,
  isReadOnly
}) => {
  if (!selectedTicket) return null;

  return (
    <div className="w-[360px] min-w-[360px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-5 text-white h-fit sticky top-6">
      
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider">
            Vista previa del ticket
          </h2>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-slate-400 text-sm uppercase">
              Ticket:
            </span>

            <a
              href={selectedTicket.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 font-black text-2xl hover:text-indigo-300 transition-all flex items-center gap-2"
            >
              {selectedTicket.ticket}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 text-slate-900 shadow-inner">
        
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="font-black text-xl">
            ⚡ MARANDU
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase">
              Ticket
            </div>

            <div className="text-red-500 font-black text-3xl">
              {selectedTicket.ticket}
            </div>
          </div>
        </div>

        <div className="space-y-5 text-sm">

  <div>
  <div className="text-slate-400 uppercase text-[11px] font-bold">
    Estado
  </div>

  {isReadOnly ? (
    <div
      className={`
        mt-2 inline-flex px-4 py-2 rounded-xl font-bold text-sm
        ${
          selectedTicket.ticketStatus === 'Resuelto'
            ? 'bg-emerald-100 text-emerald-700'
            : selectedTicket.ticketStatus === 'En Progreso'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-amber-100 text-amber-700'
        }
      `}
    >
      {selectedTicket.ticketStatus || 'Pendiente'}
    </div>
  ) : (
    <select
      value={selectedTicket.ticketStatus || 'Pendiente'}
      onChange={(e) =>
        setSelectedTicket({
          ...selectedTicket,
          ticketStatus: e.target.value
        })
      }
      className={`
        mt-2 w-full rounded-xl px-4 py-2 font-bold border outline-none transition-all
        ${
          selectedTicket.ticketStatus === 'Resuelto'
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
            : selectedTicket.ticketStatus === 'En Progreso'
            ? 'bg-blue-100 text-blue-700 border-blue-200'
            : 'bg-amber-100 text-amber-700 border-amber-200'
        }
      `}
    >
      <option value="Pendiente">Pendiente</option>
      <option value="En Progreso">En Progreso</option>
      <option value="Resuelto">Resuelto</option>
     </select>
  )}
</div>

<div>
  <div className="text-slate-400 uppercase text-[11px] font-bold">
    Prioridad
  </div>

  {isReadOnly ? (
    <div
      className={`
        mt-2 inline-flex px-4 py-2 rounded-xl font-bold text-sm
        ${
          selectedTicket.ticketPriority === 'Alta'
            ? 'bg-red-100 text-red-700'
            : selectedTicket.ticketPriority === 'Baja'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-orange-100 text-orange-700'
        }
      `}
    >
      {selectedTicket.ticketPriority || 'Media'}
    </div>
  ) : (
    <select
      value={selectedTicket.ticketPriority || 'Media'}
      onChange={(e) =>
        setSelectedTicket({
          ...selectedTicket,
          ticketPriority: e.target.value
        })
      }
      className={`
        mt-2 w-full rounded-xl px-4 py-2 font-bold border outline-none transition-all
        ${
          selectedTicket.ticketPriority === 'Alta'
            ? 'bg-red-100 text-red-700 border-red-200'
            : selectedTicket.ticketPriority === 'Baja'
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
            : 'bg-orange-100 text-orange-700 border-orange-200'
        }
      `}
    >
      <option value="Alta">Alta</option>
      <option value="Media">Media</option>
      <option value="Baja">Baja</option>
    </select>
  )}
</div>

          <div>
            <div className="text-slate-400 uppercase text-[11px] font-bold">
              Descripción
            </div>

            <p className="mt-2 leading-relaxed text-slate-700">
              {selectedTicket.fuelLevel >= 71
  ? `Enlace ingresado en nodo incorrecto. El generador actualmente se encuentra en estado óptimo con ${selectedTicket.fuelLevel}% de combustible disponible. Para más información ingresar en "Abrir ticket en página completa".`
  : `Ticket realizado por consumo de combustible del nodo. El generador actualmente se encuentra con ${selectedTicket.fuelLevel}% de combustible disponible. Para más información ingresar en "Abrir ticket en página completa".`
}
            </p>
          </div>

        </div>

      </div>

  <a
        href={selectedTicket.ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-2xl px-5 py-4 font-black uppercase tracking-widest text-sm"
      >
        <ExternalLink className="w-4 h-4" />
        Abrir ticket en página completa
      </a>
    </div>
  );
};

export default TicketPreviewPanel;
