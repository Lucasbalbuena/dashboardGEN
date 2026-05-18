import { createClient } from '@supabase/supabase-js';

const sanitizeUrl = (url: string) => {
    let trimmed = url.trim();
    if (!trimmed) return '';
    
    // If no protocol, assume https
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = `https://${trimmed}`;
    }

    try {
        const u = new URL(trimmed);
        return `${u.protocol}//${u.host}`;
    } catch {
        return trimmed;
    }
};

const supabaseUrl = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL || '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

console.log('Supabase initialization check:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'not set',
    key: supabaseAnonKey ? 'provided' : 'not set'
});

const isValidUrl = (url: string) => {
    try {
        const u = new URL(url);
        const isValid = (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.endsWith('supabase.co');
        if (!isValid && url) {
            console.warn('URL de Supabase detectada pero parece no ser una URL válida de proyecto (.supabase.co):', url);
        }
        return isValid;
    } catch {
        return false;
    }
};

const isConfigured = supabaseUrl && 
                    supabaseAnonKey && 
                    supabaseUrl !== 'undefined' && 
                    supabaseAnonKey !== 'undefined' &&
                    isValidUrl(supabaseUrl);

if (!isConfigured) {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('CRITICAL: Supabase keys are missing. Auth will fail.');
    } else if (!isValidUrl(supabaseUrl)) {
        console.error('CRITICAL: Supabase URL is malformed or invalid:', supabaseUrl);
    }
}

export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : new Proxy({} as any, {
        get: (target, prop) => {
            if (['auth', 'from', 'storage', 'channel', 'functions', 'rpc'].includes(prop as string)) {
                return new Proxy({}, {
                    get: (target2, prop2) => {
                        return async (...args: any[]) => {
                            const msg = !supabaseUrl || !supabaseAnonKey 
                                ? 'Supabase no está configurado. Por favor, configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en los ajustes del proyecto.'
                                : !isValidUrl(supabaseUrl)
                                ? `La URL de Supabase es inválida o no corresponde a un proyecto oficial: "${supabaseUrl}". Debe ser algo como https://xyz.supabase.co`
                                : 'Error crítico de inicialización de Supabase.';
                            console.error('Supabase Proxy Error:', msg);
                            throw new Error(msg);
                        };
                    }
                });
            }
            return undefined;
        }
      });
