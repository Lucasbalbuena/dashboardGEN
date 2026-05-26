import { supabase } from './supabaseClient';
import { Generator, StoredGenerator, ChangeLog, FuelLoad, Outage, Report } from './types';

function parseIndustrialNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;

  const cleaned = String(value)
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
    .trim();

  if (!cleaned || cleaned === '-' || cleaned === '.') {
    return null;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

 const supabaseService = {
  // --- AUTH ---
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // --- GENERADORES ---
  async getGenerators(): Promise<StoredGenerator[]> {
    const { data, error } = await supabase
      .from('generadores')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;

    return (data || []).map(g => ({
      id: Number(g.id),
      name: g.nombre,
      executionHours: g.horas_motor !== null ? `${g.horas_motor} Hr` : '0 Hr',
      fuelLevel: Number(g.combustible || 0),
      tankCapacity: g.capacidad_combustible != null
  ? `${g.capacidad_combustible} Lts`
  : '0 Lts',
      powerKVA: g.potencia !== null ? `${g.potencia}KVA` : (g.voltaje !== null ? `${g.voltaje}V` : '22KVA'), 
      batteryVoltage: g.bateria !== null ? `${g.bateria}V` : '12V',
      lastRechargeLiters: '0',
      lastRechargeDate: g.ultima_carga || g.updated_at || g.created_at || g.ultima_lectura || new Date().toISOString(),
      serialNumber: g.nodo,
    }));
  },

  async saveGenerator(gen: Partial<StoredGenerator> & { name: string }) {
    console.log('RAW input:', gen);

    const retry = async (fn: () => Promise<any>, retries = 1): Promise<any> => {
      try {
        return await fn();
      } catch (error: any) {
        if ((error.code === 'PGRST204' || error.message?.includes('schema cache')) && retries > 0) {
          console.warn('Supabase schema cache error, retrying in 2s...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return retry(fn, retries - 1);
        }
        throw error;
      }
    };

    const cleanedData: any = {
      nombre: gen.name || 'SIN NOMBRE',
      nodo: gen.serialNumber || gen.name || 'N/D',
      serial: gen.serialNumber || 'N/D',

      potencia: parseIndustrialNumber(gen.powerKVA) || null,
      horas_motor: parseIndustrialNumber(gen.executionHours) || null,
      combustible: parseIndustrialNumber(gen.fuelLevel) || 0,
      capacidad_combustible: parseIndustrialNumber(gen.tankCapacity) || 0,
      bateria: parseIndustrialNumber(gen.batteryVoltage) || null,
      voltaje: parseIndustrialNumber((gen as any).voltaje) || parseIndustrialNumber(gen.powerKVA) || null, 
      frecuencia: parseIndustrialNumber((gen as any).frecuencia) || null,

      estado: (gen as any).status || (gen as any).estado || 'OFF',
      alarmas: (gen as any).alarmas || [],
      ultima_lectura: new Date().toISOString()
    };

    console.log('CLEAN output:', cleanedData);

    const operation = async () => {
      let result;
      
      // Mandatory data including timestamps
      const payload = { 
        ...cleanedData, 
        updated_at: new Date().toISOString() 
      };

      if (gen.id) {
        console.log("Buscando generador...");
        console.log("Generador encontrado");
        console.log("Actualizando generador");
        result = await supabase
          .from('generadores')
          .update(payload)
          .eq('id', gen.id)
          .select();
      } else if (payload.serial && payload.serial !== 'N/D') {
        console.log("Buscando generador...");
        const { data: searchResults } = await supabase
          .from('generadores')
          .select('id')
          .eq('serial', payload.serial)
          .limit(1);

        const existente = searchResults?.[0];

        if (existente) {
          console.log("Generador encontrado");
          console.log("Actualizando generador");
          result = await supabase
            .from('generadores')
            .update(payload)
            .eq('id', existente.id)
            .select();
        } else {
          console.log("Generador no existe");
          console.log("Insertando nuevo generador");
          result = await supabase
            .from('generadores')
            .insert([payload])
            .select();
        }
      } else {
        console.log("Insertando nuevo generador");
        result = await supabase
          .from('generadores')
          .insert([payload])
          .select();
      }
      
      if (result.error) {
        console.error("ERROR UPSERT/UPDATE SUPABASE:", result.error);
        throw result.error;
      }
      console.log('Operación exitosa (Respuesta):', result.data);
      return result.data;
    };

    return await retry(operation);
  },

  async deleteGenerator(id: number) {
    const { error } = await supabase
      .from('generadores')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- ESCANEOS (OCR) ---
  async saveScan(scanData: {
  serial?: string;
  texto_ocr?: string;
  json_extraido?: any;
}) {

  console.log("SAVE SCAN INPUT:", scanData);

  const payload = {
  texto_ocr: scanData.texto_ocr || "",
  json_extraido: JSON.stringify(scanData.json_extraido || {})
};

  console.log("SAVE SCAN PAYLOAD:", payload);

  const { data, error } = await supabase
    .from('escaneos')
    .insert([payload])
    .select();

  if (error) {
    console.error("SUPABASE SAVE SCAN ERROR:", error);
    throw error;
  }

  return data;
},

  // --- EVENTOS (Logs, Alertas, Outages) ---
  async logEvent(event: {
    id?: string | number;
    serial?: string;
    generador?: string;
    generador_nombre?: string;
    operador?: string;
    tipo: string;
    fecha?: string;
    inicio_corte?: string;
    restablecimiento?: string;
    estado?: string;
    metadata?: any;
    [key: string]: any;
  }) {
    console.log('Sincronizando evento con Supabase:', event.tipo);
    
    // Construimos el payload siguiendo estrictamente las instrucciones del usuario
    // Usamos solo columnas que el usuario confirmó que existen o que son seguras
    const payload: any = {
      tipo: event.tipo,
      generador: event.generador || event.generador_nombre || "Desconocido",
      serial: event.serial || null,
      fecha: event.fecha || new Date().toISOString().split('T')[0],
      inicio_corte: event.inicio_corte || null,
      restablecimiento: event.restablecimiento || null,
      estado: event.estado || "OK",
    };

    // Si el evento tiene un ID, es una actualización (para finalizar cortes)
    if (event.id) {
      const { data, error } = await supabase
        .from('eventos')
        .update(payload)
        .eq('id', event.id)
        .select();
      
      if (error) {
        console.error('Error al actualizar evento:', error.message);
        throw error;
      }
      return data;
    }

    // Inserción nueva
    try {
      const { data, error } = await supabase
        .from('eventos')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error en insert de evento:', error.message);
        // Reintento con lo mínimo absoluto si falla por alguna columna
        const minimalPayload = { 
            tipo: payload.tipo, 
            generador: payload.generador, 
            fecha: payload.fecha 
        };
        const { data: retryData, error: retryError } = await supabase
            .from('eventos')
            .insert([minimalPayload])
            .select();
        if (retryError) throw retryError;
        return retryData;
      }
      console.log("Registro de corte sincronizado correctamente");
      return data;
    } catch (err) {
      console.error('Falla total en logEvent:', err);
      return null;
    }
  },

  async getEvents(limit = 100) {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error al recuperar eventos:', error.message);
      return [];
    }
    return data || [];
  },

  // --- REALTIME SUBSCRIPTIONS ---
  subscribeToGenerators(callback: (payload: any) => void) {
    return supabase
        .channel('public:generadores')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'generadores'
            },
            callback
        )
        .subscribe();
},

async deleteEvent(id: string) {

    console.log("DELETE EVENT VERSION NUEVA");

    const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error eliminando evento:", error);
        throw error;
    }
}

};

export { supabaseService };
