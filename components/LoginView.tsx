
import React, { useState, useEffect } from 'react';
import { supabaseService } from '../supabaseService';
import { supabase } from '../supabaseClient';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remembered_email'));
  const [isLoading, setIsLoading] = useState(false);
  
  const [mode, setMode] = useState<'login' | 'recovery' | 'signup'>('login');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!validateEmail(cleanEmail)) {
      setError('Por favor, ingrese un email corporativo válido.');
      return;
    }

    if (!cleanPassword) {
      setError('Por favor, ingrese su contraseña.');
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Error de configuración: Faltan las claves de Supabase. Verifique los Ajustes.');
      console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      return;
    }

    setIsLoading(true);
    setError('');

    // Timeout de seguridad (12 segundos para responder más rápido)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TE_TIMEOUT')), 12000)
    );

    try {
      console.log('--- INTENTO DE CONEXIÓN ---');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Email:', cleanEmail);
      
      const authPromise = supabaseService.signIn(cleanEmail, cleanPassword);
      
      const result: any = await Promise.race([authPromise, timeoutPromise]);
      
      const { data, error: authError } = result;
      
      if (authError) {
        console.error('Supabase Auth Error Response:', authError);
        
        if (authError.message?.toLowerCase().includes('invalid login credentials')) {
          throw new Error('AUTH_INVALID_CREDENTIALS');
        } 
        if (authError.message?.toLowerCase().includes('email not confirmed')) {
          throw new Error('AUTH_EMAIL_NOT_CONFIRMED');
        }
        if (authError.message?.includes('Invalid path') || authError.status === 404) {
          throw new Error('AUTH_INVALID_URL');
        }
        if (authError.status === 429) {
          throw new Error('AUTH_TOO_MANY_REQUESTS');
        }

        throw authError;
      }

      console.log('✅ Login exitoso para:', data.user?.email);

      if (rememberMe) {
        localStorage.setItem('remembered_email', cleanEmail);
      } else {
        localStorage.removeItem('remembered_email');
      }
      onLogin();
    } catch (err: any) {
      console.error('❌ Error en el flujo de login:', err);
      
      let displayError = 'Error inesperado al conectar.';
      
      if (err.message === 'TE_TIMEOUT') {
        displayError = 'Tiempo de espera agotado. Verifique su conexión o intente nuevamente.';
      } else if (err.message === 'AUTH_INVALID_CREDENTIALS') {
        displayError = 'Credenciales inválidas. Si aún no tiene cuenta regional, use la opción "Solicitar Acceso" debajo.';
      } else if (err.message === 'AUTH_EMAIL_NOT_CONFIRMED') {
        displayError = 'Por favor, confirme su correo electrónico (revise su Spam) antes de ingresar.';
      } else if (err.message === 'AUTH_INVALID_URL') {
        displayError = 'Error crítico: La URL de Supabase es inválida o el servicio no responde (404).';
      } else if (err.message === 'AUTH_TOO_MANY_REQUESTS') {
        displayError = 'Demasiados intentos fallidos. Intente de nuevo en unos minutos.';
      } else {
        displayError = err.message || 'Error al autenticar con Supabase.';
      }
      
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!validateEmail(cleanEmail)) {
      setError('Por favor, ingrese un email corporativo válido.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Error de configuración en Supabase. Verifique los Ajustes.');
      return;
    }

    setIsLoading(true);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TE_TIMEOUT')), 20000)
    );

    try {
        console.log('Iniciando registro para:', cleanEmail);
        const result: any = await Promise.race([
          supabaseService.signUp(cleanEmail, cleanPassword),
          timeoutPromise
        ]);
        
        const { error: signUpError } = result;
        
        if (signUpError) {
          console.error('Error de registro Supabase:', signUpError);
          
          if (signUpError.message?.includes('User already registered')) {
            throw new Error('Ese email corporativo ya está registrado. Intente iniciar sesión.');
          }
          if (signUpError.message?.includes('Invalid path') || signUpError.status === 404) {
            throw new Error('Error crítico: URL de Supabase incorrecta.');
          }
          if (signUpError.message?.toLowerCase().includes('fetch') || signUpError.message?.toLowerCase().includes('network')) {
            throw new Error('Error de red al intentar registrarse.');
          }
          
          throw signUpError;
        }
        
        alert('Registro exitoso. Revise su email corporativo para confirmar su cuenta antes de iniciar sesión.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        console.error('❌ Error en el proceso de registro:', err);
        let displayError = 'Error al registrarse.';
        if (err.message === 'TE_TIMEOUT') {
          displayError = 'Tiempo de espera agotado al registrar. Reintente.';
        } else {
          displayError = err.message || 'Error al procesar su solicitud.';
        }
        setError(displayError);
    } finally {
        setIsLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 space-y-8 border border-slate-200">
        <div className="text-center space-y-2">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-xl shadow-indigo-900/20">ASG</div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            {mode === 'login' && 'Acceso Sistema Generadores'}
            {mode === 'recovery' && 'Recuperar Acceso'}
            {mode === 'signup' && 'Crear Cuenta'}
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Infraestructura Crítica NOC</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-black border border-red-100 flex items-center gap-3 animate-pulse">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Corporativo:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-800 transition-all placeholder:text-slate-300"
                placeholder="usuario@marandú.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña:</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-800 transition-all placeholder:text-slate-300 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  {showPass ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-1">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
              />
              <label htmlFor="remember" className="text-[11px] font-bold text-slate-600 uppercase tracking-wide cursor-pointer select-none">Recordar email</label>
            </div>

            <button 
              disabled={isLoading}
              className="w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
            </button>
            <div className="flex flex-col items-center gap-3 pt-2">
              <button type="button" onClick={() => { setMode('recovery'); setError(''); }} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">¿Olvidó su contraseña?</button>
              <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">Solicitar Acceso (Sign Up)</button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Corporativo:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-800 transition-all"
                placeholder="usuario@marandu.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña (mín. 6 caracteres):</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-800 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Contraseña:</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-800 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              disabled={isLoading}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Procesando...' : 'Crear Cuenta Corporativa'}
            </button>
            <button 
              type="button" 
              onClick={() => { setMode('login'); setError(''); }} 
              className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest text-center py-2 hover:text-slate-600 transition-colors"
            >
              Volver al Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginView;
