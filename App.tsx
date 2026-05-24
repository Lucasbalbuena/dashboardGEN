
import React, { useState, useMemo, useEffect } from 'react';
import { Generator, StoredGenerator, Status, SortConfig, Report, ChangeLog, ReportEntry, FuelLoad, Outage } from './types';
import { INITIAL_GENERATORS } from './constants';
import { Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GeneratorTable from './components/GeneratorTable';
import Header from './components/Header';
import Legend from './components/Legend';
import ReportsView from './components/ReportsView';
import GoogleSheetImportModal from './components/GoogleSheetImportModal';
import LogsView from './components/LogsView';
import FuelManagementView from './components/FuelManagementView';
import LoginView from './components/LoginView';
import OutagesView from './components/OutagesView';
import ManualCaptureModal from './components/ManualCaptureModal';
import EditGeneratorModal from './components/EditGeneratorModal';
import { supabaseService } from './services/supabaseService';

declare var html2canvas: any;

const calculateDaysSince = (dateStr: string, fromDate: Date): number => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return 0;
  const [day, month, year] = parts;
  const formattedDate = new Date(`${year}-${month}-${day}`);
  if (isNaN(formattedDate.getTime())) return 0;
  
  const controlDate = new Date(fromDate);
  controlDate.setHours(0, 0, 0, 0);
  formattedDate.setHours(0,0,0,0);
  
  const diffTime = controlDate.getTime() - formattedDate.getTime();
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const extractNumber = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const match = val.match(/(\d+[,.]?\d*)/);
  if (!match) return 0;
  return parseFloat(match[0].replace(',', '.'));
};

import { supabaseService } from './supabaseService';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [view, setView] = useState<'dashboard' | 'reports' | 'logs' | 'fuel' | 'outages' | 'scanner'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [currentOperator, setCurrentOperator] = useState('Operador NOC');
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('viewer');
  
  const [generators, setGenerators] = useState<StoredGenerator[]>([]);
  const [fuelLoads, setFuelLoads] = useState<FuelLoad[]>([]);
  const [outages, setOutages] = useState<Outage[]>([]);
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: number; key: keyof Generator } | null>(null);
  const [controlDate, setControlDate] = useState(new Date());
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGenToEdit, setSelectedGenToEdit] = useState<Generator | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check Auth and Initialize Data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
     if (session?.user?.email) {
  setCurrentOperator(session.user.email);

  if (session.user.email === 'noc@marandu.com.ar') {
    setUserRole('admin');
  } else {
    setUserRole('viewer');
  }
}
      setIsLoadingAuth(false);
    };

    checkAuth();

   const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Evento de Auth:', event);

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    setIsAuthenticated(true);

    if (session?.user?.email) {
      setCurrentOperator(session.user.email);

      if (session.user.email === 'noc@marandu.com.ar') {
        setUserRole('admin');
      } else {
        setUserRole('viewer');
      }
    }

  } else if (event === 'SIGNED_OUT') {
    setIsAuthenticated(false);
    setCurrentOperator('Operador NOC');
    setUserRole('viewer');
    setGenerators([]);
    setLogs([]);
  }
});

return () => {
  authListener.subscription.unsubscribe();
};

}, []);
  // Fetch Data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      
      // Subscribe to Realtime Updates
      const channel = supabaseService.subscribeToGenerators((payload) => {
        console.log('Realtime update:', payload);
        loadData(); // Re-fetch for simplicity or update state specifically
      });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      // Load generators first (critical for dashboard)
      const gens = await supabaseService.getGenerators();
      setGenerators(gens);
      
      // Load events independently (non-blocking)
      try {
        const events = await supabaseService.getEvents();
        
        // Map logs
        const mappedLogs: ChangeLog[] = events.map((e: any) => ({
          id: String(e.id),
          timestamp: e.created_at || e.fecha || new Date().toISOString(),
          generatorName: e.generador || e.generador_nombre || 'Desconocido',
          field: e.tipo || 'Evento',
          oldValue: '',
          newValue: (e.litros > 0) ? `${e.litros} Lts` : (e.nivel_resultante ? `${e.nivel_resultante}%` : (e.estado || '')),
          source: (e.tipo && e.tipo.includes('OCR')) ? 'AI' : ((e.tipo && e.tipo.includes('CORTE')) ? 'Outage' : 'Manual'),
          operator: e.operador || 'Sistema'
        }));
        setLogs(mappedLogs);

        // Map outages from eventos with deep fallbacks
        const outageEvents = events.filter((e: any) => e.tipo === 'CORTE_ENERGIA' || e.tipo === 'CORTE_ENERGIA_INI');
        const mappedOutages: Outage[] = outageEvents.map((e: any) => {
          const meta = e.metadata || {};
          
          // Fallbacks de columnas
          const genName = e.generador || e.generador_nombre || 'Equipo Desconocido';
          const fecha = e.fecha || e.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
          const inicio = e.inicio_corte || meta.inicio_corte || '00:00';
          const fin = e.restablecimiento || meta.restablecimiento || '';
          
          // Cálculo on-the-fly si faltan datos en DB
          let duracion = Number(e.duracion || meta.duracion || 0);
          let fuelImpact = Number(e.combustible_consumido_pct || meta.combustible_consumido_pct || 0);
          
          if (!duracion && inicio && fin) {
            const sParts = inicio.split(':').map(Number);
            const eParts = fin.split(':').map(Number);
            if (sParts.length === 2 && eParts.length === 2) {
                const sMin = sParts[0] * 60 + sParts[1];
                const eMin = eParts[0] * 60 + eParts[1];
                duracion = Math.max(0, (eMin - sMin) / 60);
                if (!fuelImpact) fuelImpact = Math.round(duracion * 8.33 * 10) / 10;
            }
          }

          const litersImpact = Number(e.combustible_consumido_lts || meta.combustible_consumido_lts || 0);

          return {
            id: String(e.id),
            generatorId: 0,
            generatorName: genName,
            date: fecha,
            startTime: inicio,
            endTime: fin,
            durationHours: duracion,
            fuelDeducted: fuelImpact,
            litersDeducted: litersImpact || (fuelImpact > 0 ? Math.round(fuelImpact * 0.5 * 10) / 10 : 0), // 0.5 es un fallback arbitrario si no hay capacidad
            operator: e.operador || 'Operador',
            serial: e.serial || meta.serial || ''
          };
        });
        setOutages(mappedOutages);
      } catch (eventErr) {
        console.error('Error loading events:', eventErr);
      }
    } catch (err) {
      console.error('Error loading Supabase data:', err);
    }
  };

  const handleGeneratorUpdate = async (id: number, key: keyof StoredGenerator, value: string, source: ChangeLog['source'] = 'Manual') => {
    const gen = generators.find(g => g.id === id);
    if (!gen) return;

    let updatedValue: string | number = value;
    if (key === 'fuelLevel') {
      const numericValue = parseFloat(value.replace(',', '.'));
      updatedValue = isNaN(numericValue) ? gen[key] : numericValue;
    }

    try {
      // Local check to avoid unnecessary updates
      if (gen[key] !== updatedValue) {
        const updatedGen = { ...gen, [key]: updatedValue } as StoredGenerator;
        await supabaseService.saveGenerator(updatedGen);
        
        // Log the change in eventos
        await supabaseService.logEvent({
          serial: gen.serialNumber,
          generador_nombre: gen.name,
          operador: currentOperator,
          tipo: `MOD_AUTO_${key.toUpperCase()}`,
          litros: 0,
          nivel_resultante: key === 'fuelLevel' ? Number(updatedValue) : (gen.fuelLevel || 0)
        });

        // Optimistic UI update or just wait for re-fetch from realtime
        setGenerators(prev => prev.map(g => g.id === id ? updatedGen : g));
      }
    } catch (err) {
      console.error('Error updating generator in Supabase:', err);
    }
    setEditingCell(null);
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
  };

  const calculateStatus = (fuelLevel: number): Status => {
    if (fuelLevel >= 71) return Status.Optimal;
    if (fuelLevel >= 70) return Status.Warning;
    return Status.NeedsRecharge;
  };

  const processedGenerators: Generator[] = useMemo(() => {
    return generators.map(g => ({
      ...g,
      status: calculateStatus(g.fuelLevel),
      timeSinceLastRecharge: calculateDaysSince(g.lastRechargeDate, controlDate),
    }));
  }, [generators, controlDate]);

  const sortedGenerators = useMemo(() => {
    const sortableItems = [...processedGenerators];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === 'ascending' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      });
    }
    return sortableItems;
  }, [processedGenerators, sortConfig]);

  const handleScanResult = async (id: number, fuel: number, hours: string) => {
    console.log("Sincronización de OCR completada. Recargando datos...");
    await loadData();
    setToast({ message: "Sincronización completa", type: "success" });
  };

  const handleAddFuelLoad = async (genId: number, liters: string, date: string, operator: string) => {
    const gen = generators.find(g => g.id === genId);
    if (!gen) return;

    const added_liters = extractNumber(liters);
    const tank_cap = extractNumber(gen.tankCapacity);
    
    const current_liters = (gen.fuelLevel / 100) * tank_cap;
    const new_liters = current_liters + added_liters;
    const new_level = tank_cap > 0 ? Math.min(100, Math.round((new_liters / tank_cap) * 100)) : 100;

    try {
        await supabaseService.saveGenerator({ ...gen, fuelLevel: new_level });
        const eventoPayload = {
          serial: gen.serialNumber,
          generador_nombre: gen.name,
          operador: operator || currentOperator,
          tipo: 'CARGA_COMBUSTIBLE',
          litros: Number(added_liters),
          nivel_resultante: Number(new_level)
        };

        console.log('INSERT EVENTO LIMPIO (FUEL):', eventoPayload);
        await supabaseService.logEvent(eventoPayload);
        loadData();
    } catch (err) {
        console.error("Error adding fuel load:", err);
    }
  };

  const handleDownloadJPG = async () => {
    const element = document.getElementById('capture-container');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false
      });
      
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement('a');
      link.download = `dashboard-generadores-${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Error capturando pantalla:", err);
      alert("Hubo un error al generar la captura de imagen.");
    }
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de que desea restablecer todos los datos a los valores iniciales? Se perderán los cambios locales.')) {
      localStorage.removeItem('generators');
      localStorage.removeItem('fuel_loads');
      localStorage.removeItem('outages');
      localStorage.removeItem('change_logs');
      localStorage.removeItem('reports_v2');
      window.location.reload();
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
      <div id="capture-container" className="max-w-7xl mx-auto space-y-6 print:space-y-6 print:max-w-full print:p-4 print:bg-white relative">
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-200">
              <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-bold text-slate-800">Agregando generador...</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
                toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm uppercase tracking-widest">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Header 
          userRole={userRole}
          onAddGenerator={async () => {
            if (isAdding) return;
            
            const nextIndex = generators.length + 1;
            const nombre = `Nuevo GE ${nextIndex}`;
            const nodo = `NODO-${nextIndex}`;
            
            // Validation
            if (!nombre || !nodo) {
              alert("Nombre y Nodo son obligatorios.");
              return;
            }

            setIsAdding(true);
            const newGenData: Omit<StoredGenerator, 'id'> = {
              name: nombre,
              executionHours: '0 Hr',
              fuelLevel: 100,
              tankCapacity: '50 Lts',
              powerKVA: '22KVA',
              lastRechargeLiters: '0',
              lastRechargeDate: new Date().toLocaleDateString('es-ES'),
              serialNumber: nodo // mapping to serialNumber in local type
            };

            try {
                console.log('Iniciando creación de generador...');
                // Insert without ID -> Supabase generates it
                const result = await supabaseService.saveGenerator(newGenData as any);
                
                if (result && result[0]) {
                  console.log('Generador creado exitosamente:', result[0]);
                  setToast({ message: "Generador agregado correctamente", type: "success" });
                  // Refresh data
                  await loadData();
                } else {
                  console.warn("No se devolvieron datos, recargando lista...");
                  await loadData();
                }
            } catch (err: any) {
                console.error("Error crítico al agregar generador:", err);
                setToast({ message: `Error: ${err.message || "Falla en RLS o Red"}`, type: "error" });
            } finally {
                setIsAdding(false);
            }
          }}
          onFileUpload={() => {}}
          onGoogleSheetImportClick={() => setIsSheetModalOpen(true)}
          onScanClick={() => setView('scanner')}
          controlDate={controlDate}
          onControlDateChange={(ds) => setControlDate(new Date(`${ds}T00:00:00`))}
          onSaveSessionCapture={() => alert('Sesión guardada')}
          onDownloadJPG={handleDownloadJPG}
          isHistoryView={false}
          onReturnToLive={() => setControlDate(new Date())}
          view={view}
          onToggleView={(v) => setView(v)}
          currentOperator={currentOperator}
          onOperatorChange={setCurrentOperator}
          onResetData={() => {
            if (window.confirm('¿Desea cerrar sesión y limpiar caché?')) {
                handleLogout();
            }
          }}
        />

        {view === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-2 print:hidden">
               <button 
                onClick={() => setView('scanner')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 active:scale-95"
               >
                 <Zap className="w-5 h-5" />
                 👉 Escanear Generador
               </button>
               {userRole === 'admin' && (
  <button 
    onClick={() => setView('scanner')}
    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 active:scale-95"
  >
    <Zap className="w-5 h-5" />
    👉 Escanear Generador
  </button>
)}
            </div>
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
              <div className="overflow-x-auto">
                <GeneratorTable 
                  generators={sortedGenerators} 
                  onSort={(key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} 
                  sortConfig={sortConfig}
                  selectedRowId={selectedRowId}
                  onRowClick={setSelectedRowId}
                  editingCell={editingCell}
                  onCellDoubleClick={(id, key) => setEditingCell({ id, key })}
                  onUpdate={handleGeneratorUpdate}
                  onCancelEdit={() => setEditingCell(null)}
                  onEdit={(gen) => {
                    setSelectedGenToEdit(gen);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={async (id) => {
                    try {
                        await supabaseService.deleteGenerator(id);
                        setToast({ message: "Generador eliminado", type: "success" });
                        setGenerators(prev => prev.filter(g => g.id !== id));
                    } catch (err: any) {
                        console.error("Error deleting generator:", err);
                        setToast({ message: `Error al eliminar: ${err.message}`, type: "error" });
                    }
                  }}
                  isReadOnly={userRole === 'viewer'}
                />
              </div>
              <Legend />
            </div>
          </div>
        )}

        {view === 'fuel' && (
          <FuelManagementView
            isReadOnly={userRole === 'viewer'} 
            generators={generators}
            fuelLoads={fuelLoads}
            onAddLoad={handleAddFuelLoad}
            onDeleteLoad={(id) => setFuelLoads(prev => prev.filter(l => l.id !== id))}
            defaultOperator={currentOperator}
          />
        )}

        {view === 'outages' && (
          <OutagesView 
            generators={generators}
            outages={outages}
            onAddOutage={async (genId, date, start, end, operator) => {
               const gen = generators.find(g => g.id === genId);
               if (!gen) return;

               const isFinalized = !!end;
               let duration = 0;
               let fuelDeducted = 0;

               if (isFinalized) {
                  const sParts = start.split(':').map(Number);
                  const eParts = end.split(':').map(Number);
                  const sDate = new Date(date); sDate.setHours(sParts[0], sParts[1], 0);
                  const eDate = new Date(date); eDate.setHours(eParts[0], eParts[1], 0);
                  
                  duration = Math.max(0, (eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60));
                  fuelDeducted = Math.round(duration * 8.33 * 10) / 10;

                  // Actualizar combustible en el dashboard
                  const newLevel = Math.max(0, Math.round((gen.fuelLevel - fuelDeducted) * 10) / 10);
                  await supabaseService.saveGenerator({ ...gen, fuelLevel: newLevel });
               }

               const eventPayload = {
                  tipo: 'CORTE_ENERGIA',
                  generador: gen.name,
                  serial: gen.serialNumber,
                  fecha: date,
                  inicio_corte: start,
                  restablecimiento: end || null,
                  estado: isFinalized ? 'FINALIZADO' : 'ACTIVO',
                  duracion: duration || null,
                  combustible_consumido_pct: fuelDeducted || null
               };

               try {
                  await supabaseService.logEvent(eventPayload as any);
                  setToast({ message: isFinalized ? "Corte registrado y calculado" : "Inicio de corte registrado", type: "success" });
                  await loadData();
               } catch (err) {
                  console.error("Error al registrar corte:", err);
               }
            }}
            onSetOutageEnd={async (id, end) => {
               const outage = outages.find(o => o.id === id);
               if (!outage) return;

               const gen = generators.find(g => g.name === outage.generatorName || g.serialNumber === outage.serial);
               if (!gen) return;

               const sParts = outage.startTime.split(':').map(Number);
               const eParts = end.split(':').map(Number);
               const date = outage.date;
               const sDate = new Date(date); sDate.setHours(sParts[0], sParts[1], 0);
               const eDate = new Date(date); eDate.setHours(eParts[0], eParts[1], 0);
               
               const duration = Math.max(0, (eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60));
               const fuelDeducted = Math.round(duration * 8.33 * 10) / 10;
               const newLevel = Math.max(0, Math.round((gen.fuelLevel - fuelDeducted) * 10) / 10);

               try {
                  await supabaseService.saveGenerator({ ...gen, fuelLevel: newLevel });
                  
                  await supabaseService.logEvent({
                    id: outage.id,
                    tipo: 'CORTE_ENERGIA',
                    generador: gen.name,
                    serial: gen.serialNumber,
                    fecha: date,
                    inicio_corte: outage.startTime,
                    restablecimiento: end,
                    estado: 'FINALIZADO',
                    duracion: duration,
                    combustible_consumido_pct: fuelDeducted
                  } as any);

                  setToast({ message: "Corte finalizado y combustible actualizado", type: "success" });
                  await loadData();
               } catch (err) {
                  console.error("Error al finalizar corte:", err);
               }
            }}
            onDeleteOutage={async (id) => {

   if (!window.confirm("¿Desea eliminar este registro de corte?")) {
      return;
   }

   try {

      await supabaseService.deleteEvent(id);

      setOutages(prev => prev.filter(o => o.id !== id));

      setToast({
         message: "Registro eliminado correctamente",
         type: "success"
      });

   } catch (err) {

      console.error("Error eliminando corte:", err);

      setToast({
         message: "Error al eliminar registro",
         type: "error"
      });
   }
}}
            defaultOperator={currentOperator}
           
            isReadOnly={currentUser?.role === 'viewer'}
          />
        )}

         

        {view === 'reports' && (
          <ReportsView 
            reports={reports}
            generators={generators}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onFinalizeMonth={(m) => {
              setReports(prev => prev.map(r => r.month === m ? { ...r, isFinalized: true } : r));
            }}
            onAddEntry={() => {}}
            onUpdateEntry={() => {}}
            onDeleteEntry={() => {}}
            onAddReport={() => {}}
          />
        )}

        {view === 'logs' && <LogsView logs={logs} />}
        
        {userRole === 'admin' && view === 'scanner' && (
          <ManualCaptureModal 
            isOpen={true} 
            onClose={() => setView('dashboard')} 
            generators={generators} 
            onScanConfirm={(id, fuel, hours) => {
              handleScanResult(id, fuel, hours);
              setView('dashboard');
            }}
            isViewOnly={true}
          />
        )}
      </div>

      <div className="fixed bottom-4 right-4 print:hidden">
        <button 
          onClick={handleLogout}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl border border-slate-700"
        >
          Cerrar Sesión
        </button>
      </div>

      <GoogleSheetImportModal isOpen={isSheetModalOpen} onClose={() => setIsSheetModalOpen(false)} onImport={async () => {}} />

      <EditGeneratorModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        generator={selectedGenToEdit}
        onSave={async (updated) => {
           try {
             await supabaseService.saveGenerator(updated as any);
             setToast({ message: "Generador actualizado", type: "success" });
             await loadData();
           } catch (err: any) {
             setToast({ message: `Error: ${err.message}`, type: "error" });
             throw err;
           }
        }}
        onDelete={async (id) => {
          try {
            await supabaseService.deleteGenerator(id);
            setToast({ message: "Generador eliminado", type: "success" });
            await loadData();
          } catch (err: any) {
            setToast({ message: `Error: ${err.message}`, type: "error" });
            throw err;
          }
        }}
      />
    </div>
  );
};

export default App;
