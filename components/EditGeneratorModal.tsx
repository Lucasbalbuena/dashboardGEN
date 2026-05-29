
import React, { useState, useEffect } from 'react';
import { Generator, Status } from '../types';
import { X, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  generator: Generator | null;
  onSave: (updated: Partial<Generator>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const EditGeneratorModal: React.FC<EditGeneratorModalProps> = ({
  isOpen,
  onClose,
  generator,
  onSave,
  onDelete
}) => {

  const [formData, setFormData] =
    useState<Partial<Generator>>({});

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (generator) {
      setFormData({
        ...generator,

        ticket: generator.ticket || '',
        ticketUrl: generator.ticketUrl || '',
        ticketStatus: generator.ticketStatus || 'Pendiente',
        ticketPriority: generator.ticketPriority || 'Media',
        ticketDescription: generator.ticketDescription || '',
      });
    }
  }, [generator]);

  if (!isOpen || !generator) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Nombre es obligatorio");
    
    setIsSaving(true);
    try {
      console.log("EDITANDO:", formData);
      await onSave(formData);
      console.log("UPDATE OK");
      onClose();
    } catch (err) {
      console.error("ERROR UPDATE:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                Editar Generador
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">ID: {generator.id}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nombre del Generador</label>
                <input 
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nodo / Serial</label>
                <input 
                  type="text"
                  value={formData.serialNumber || ''}
                  onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Potencia (KVA)</label>
                <input 
                  type="text"
                  value={formData.powerKVA || ''}
                  onChange={e => setFormData({ ...formData, powerKVA: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

<div className="space-y-2">
  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
    Capacidad Combustible (L)
  </label>

  <input
    type="number"
    value={formData.tankCapacity || ''}
    onChange={e =>
      setFormData({
        ...formData,
        tankCapacity: e.target.value
      })
    }
    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
  />
</div>

<div className="space-y-2">
  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
    Ticket
  </label>

  <input
    type="text"
    value={formData.ticket || ''}
    onChange={(e) =>
      setFormData({
        ...formData,
        ticket: e.target.value
      })
    }
    placeholder="I-005289"
    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
  />
</div>

<div className="space-y-2">
  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
    URL Ticket
  </label>

  <input
    type="text"
    value={formData.ticketUrl || ''}
    onChange={(e) =>
      setFormData({
        ...formData,
        ticketUrl: e.target.value
      })
    }
    placeholder="https://tickets..."
    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
  />
</div>
<div className="space-y-2">
  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
    Estado Ticket
  </label>

  <select
    value={formData.ticketStatus || 'Pendiente'}
    onChange={(e) => {

  console.log(e.target.value);

  setFormData({
    ...formData,
    ticketStatus: e.target.value
  })
}}
    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
  >
    <option value="Pendiente">Pendiente</option>
    <option value="En Progreso">En Progreso</option>
    <option value="Resuelto">Resuelto</option>
  </select>
</div>

<div className="space-y-2">
  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
    Prioridad Ticket
  </label>

  <select
    value={formData.ticketPriority || 'Media'}
    onChange={(e) =>
      setFormData({
        ...formData,
        ticketPriority: e.target.value
      })
    }
    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
  >
    <option value="Alta">Alta</option>
    <option value="Media">Media</option>
    <option value="Baja">Baja</option>
  </select>
</div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Horas Motor</label>
                <input 
                  type="text"
                  value={formData.executionHours || ''}
                  onChange={e => setFormData({ ...formData, executionHours: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Combustible (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={formData.fuelLevel || 0}
                  onChange={e => setFormData({ ...formData, fuelLevel: Number(e.target.value) })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Batería (V)</label>
                <input 
                  type="text"
                  value={formData.batteryVoltage || ''}
                  onChange={e => setFormData({ ...formData, batteryVoltage: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estado</label>
                <select 
                  value={formData.status || Status.Normal}
                  onChange={e => setFormData({ ...formData, status: e.target.value as Status })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value={Status.Optimal}>ÓPTIMO</option>
                  <option value={Status.Normal}>NORMAL</option>
                  <option value={Status.Warning}>ADVERTENCIA</option>
                  <option value={Status.NeedsRecharge}>NECESITA CARGA</option>
                </select>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button 
                type="button"
                onClick={() => {
                  if (confirm("¿Estás seguro de que quieres eliminar este generador?")) {
                    onDelete(generator.id);
                    onClose();
                  }
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border-2 border-rose-100"
              >
                <Trash2 className="w-5 h-5" />
                Eliminar
              </button>

              <div className="flex-grow"></div>

              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>

              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : <Save className="w-5 h-5" />}
                Guardar Cambios
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditGeneratorModal;
