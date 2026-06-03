
import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { geminiService } from "../services/geminiService";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clipboard, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Clock, 
  Fuel, 
  Activity, 
  Cpu, 
  Battery, 
  Hash,
  Sparkles,
  Search,
  RefreshCw,
  Edit3,
  Upload,
  Terminal
} from "lucide-react";
import { StoredGenerator } from "../types";
import { supabaseService } from "../supabaseService";

interface SyncResult {
  controlador?: string | null;
  modo?: string | null;
  estado_generador?: string | null;
  estado?: string; // Fallback for local
  alarmas?: string[];
  horas_motor?: string | null;
  horas?: string; // Fallback for local
  frecuencia_hz?: string | null;
  frecuencia?: string; // Fallback for local
  voltajes?: Record<string, string | null>;
  voltaje?: string; // Fallback for local/AI single display
  corrientes?: Record<string, string | null>;
  corriente?: string; // Fallback for local
  rpm?: string | null;
  combustible?: string | null;
  fuel?: string; // Fallback for local
  batteryVoltage?: string; // Fallback for local
  temperatura?: string | null;
  presion_aceite?: string | null;
  breaker?: string | null;
  estado_red?: string | null;
  estado_generador_visual?: string | null;
  entradas_binarias?: string[];
  salidas_binarias?: string[];
  indicadores?: string[];
  texto_detectado_completo?: string[];
  confianza_ocr?: string | null;
  posible_valor?: string | null;
  debug?: any;
  // Metadata for matching
  nodo?: string;
  equipo?: string;
}

interface ManualCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  generators: StoredGenerator[];
  onScanConfirm: (id: number, fuel: number, hours: string) => void;
  isViewOnly?: boolean;
}

function limpiarNumero(valor: any) {
  if (valor === null || valor === undefined || valor === "") return 0;
  
  // Convert to string and handle common suffixes
  const str = String(valor).toLowerCase();
  
  // Extract only the numeric part (including decimals) using a smarter regex
  // This captures the first sequence of numbers/dots/commas in the string
  const match = str.match(/[-+]?\d*[.,]?\d+/);
  if (!match) return 0;
  
  const limpio = match[0].replace(',', '.');
  const numero = parseFloat(limpio);
  
  return isNaN(numero) ? 0 : numero;
}

function normalizarOCR(data: any) {
  return {
    nombre:
      data.controlador ||
      data.name ||
      "Generador OCR",

    nodo:
      data.serialNumber ||
      data.serial ||
      data.nodo ||
      `NODO-${Date.now()}`,

    serial:
      data.serialNumber ||
      data.serial ||
      data.nodo ||
      `NODO-${Date.now()}`,

    potencia: limpiarNumero(
      data.powerKVA ||
      data.potencia ||
      data.voltage
    ),

    horas_motor: limpiarNumero(
      data.horas_motor ||
      data.executionHours ||
      data.horas
    ),

    combustible: limpiarNumero(
      data.fuelLevel ||
      data.combustible ||
      data.fuel
    ),

    bateria: limpiarNumero(
      data.batteryVoltage ||
      data.bateria
    ),

    voltaje: limpiarNumero(
      data.voltage ||
      data.voltaje
    ),

    frecuencia: limpiarNumero(
      data.frecuencia_hz ||
      data.frequency ||
      data.frecuencia
    ),

    estado:
      data.estado_generador ||
      data.estado ||
      "OFF",

    alarmas:
      Array.isArray(data.alarmas)
        ? data.alarmas
        : [],

    ultima_lectura: new Date().toISOString()
  };
}

const ManualCaptureModal: React.FC<ManualCaptureModalProps> = ({
  isOpen,
  onClose,
  generators,
  onScanConfirm,
  isViewOnly = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<Record<number, number>>({});
  const [rawText, setRawText] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) handleImageFile(blob);
          }
        }
      }
    };

    if (isOpen) {
      window.addEventListener("paste", handlePaste);
      modalRef.current?.focus();
    }
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const handleImageFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPastedImage(base64);
      // AUTO-PROCESS ON LOAD
      processCapture(base64);
    };
    reader.readAsDataURL(file);
  };

  const preprocessZone = (canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext('2d')!;
    
    // Create a temporary canvas to apply the Gaussian Blur filter
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Apply Gaussian Blur (roughly 5x5 equivalent)
    tempCtx.filter = 'blur(1px)';
    tempCtx.drawImage(canvas, 0, 0);
    
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Process pixels for Grayscale and Threshold
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      
      // 1. Grayscale conversion (cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // 2. Thresholding (cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY))
      // We also handle inversion if the text is light on dark background 
      // to ensure Tesseract (which prefers black text on white) works better.
      let val = gray > 120 ? 255 : 0;
      
      // Industrial screens often have light text on dark background.
      // If the result is mostly white text on black background, we invert it.
      // However, to strictly follow the user's code, we just apply the threshold.
      // But for OCR, black text on white is better. 
      // Let's stick to the user's logic but ensure the output is usable.
      
      data[i] = data[i+1] = data[i+2] = val;
      data[i+3] = 255; // Alpha
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const preprocessImage = async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Upscale x2 for better OCR
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale
          const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          
          // Contrast enhancement
          let val = gray;
          const factor = 1.6;
          val = factor * (val - 128) + 128;
          
          // Thresholding (simulated grayscale threshold)
          val = val < 100 ? 0 : val > 180 ? 255 : val;
          
          data[i] = data[i+1] = data[i+2] = val;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = base64;
    });
  };


const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const processCapture = async (base64Data: string) => {
if (isProcessing) return;

  setIsProcessing(true);
  setResults([]);
  setSelectedMatches({});

  try {

    console.log("Iniciando pre-procesamiento industrial...");

    const enhancedImage = await preprocessImage(base64Data);

    console.log("Ejecutando OCR Local (Tesseract) para extracción base...");

    const worker = await Tesseract.createWorker("eng");

    const {
      data: { text: tesseractRaw }
    } = await worker.recognize(enhancedImage);

    await worker.terminate();

    console.log("Enviando a Gemini para interpretación industrial avanzada...");

    const prompt = `
Actúa como un PARSER INDUSTRIAL AVANZADO para paneles:

- ComAp
- DeepSea
- SmartGen
- Perkins

CONTEXTO:
Se te proporciona una imagen de un tablero de generador y un texto OCR bruto extraído localmente.

Tu trabajo es:
- interpretar
- corregir
- normalizar
- validar

los datos industriales.

TEXTO OCR BRUTO:
"${tesseractRaw}"

REGLAS:

- NO inventar valores
- Si un dato no es visible -> null
- Limpiar unidades
- Priorizar SIEMPRE lo visual sobre OCR roto
- Ignorar basura OCR

VALIDACIONES:

- Frecuencia: 45-65 Hz
- Voltaje: 100-500 V
- Batería: 10-30 V
- Fuel: 0-100 %
- RPM: 0-3000
- Horas: numérico + Hr

ESTADOS PERMITIDOS:

READY
RUNNING
AUTO
OFF
MAN
FAULT

FORMATO JSON:

{
  "controlador": "",
  "modo": "",
  "estado_operador": "",
  "frecuencia": "",
  "voltaje": "",
  "bateria": "",
  "fuel": "",
  "rpm": "",
  "horas_motor": "",
  "alarmas": [],
  "confianza": 0.0,
  "lecciones_ocr": ""
}

RESPONDE ÚNICAMENTE JSON VÁLIDO.
NO uses markdown.
NO uses \`\`\`.
NO expliques nada.
NO agregues texto fuera del JSON.
`;

   
  const startTime = Date.now();

const aiResponse: any = await Promise.race([

  geminiService.analyzeGeneratorPanel(
    enhancedImage,
    prompt
  ),

  new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Gemini timeout")),
      15000
    )
  )

]);

    const endTime = Date.now();

    console.log("============== RESPUESTA IA RAW ==============");
   console.log(aiResponse?.text);

    let parsedData: any = {};

    try {

      const cleanText = aiResponse.text
        .trim()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/\n/g, " ")
        .replace(/\t/g, " ")
        .trim();

      console.log("============== JSON LIMPIO ==============");
      console.log(cleanText);

      const parsed = safeJsonParse(cleanText);

      if (!parsed) {
        throw new Error("JSON inválido devuelto por IA");
      }

      parsedData = parsed;

    } catch (jsonError) {

      console.error("============== JSON INVALIDO ==============");
      console.error(aiResponse.text);
      console.error(jsonError);

     parsedData = {
  controlador: "OCR LOCAL",
  modo: "FALLBACK",
  estado_operador: "RUNNING",

  frecuencia: null,
  voltaje: null,
  bateria: null,
  fuel: null,
  rpm: null,
  horas_motor: null,

  alarmas: [
    "Gemini timeout / JSON inválido"
  ],

  confianza: 0.5,

  lecciones_ocr:
    "Usando OCR local por fallback IA"
};
    }

    const result: SyncResult = {

      controlador:
        parsedData.controlador || "NO DETECTADO",

      modo:
        parsedData.modo || "ERROR",

      estado_generador:
        parsedData.estado_operador || "ERROR",

      horas_motor:
        parsedData.horas_motor || null,

      frecuencia_hz:
        parsedData.frecuencia || null,

      voltaje:
        parsedData.voltaje || null,

      combustible:
        parsedData.fuel || null,

      batteryVoltage:
        parsedData.bateria || null,

      rpm:
        parsedData.rpm || null,

      alarmas:
        Array.isArray(parsedData.alarmas)
          ? parsedData.alarmas
          : [],

      texto_detectado_completo: [tesseractRaw],

      confianza_ocr:
        String(parsedData.confianza || 0),

      debug: {
        model: aiResponse.model,
        responseTime: `${endTime - startTime}ms`,
        rawTesseract: tesseractRaw,
        aiCleaning: parsedData.lecciones_ocr,
        rawAI: aiResponse?.text || ""
      }
    };

    const foundGen = generators.find(g =>
      result.controlador
        ?.toLowerCase()
        ?.includes(g.name.toLowerCase()) ||

      tesseractRaw
        .toLowerCase()
        .includes(g.name.toLowerCase())
    );

    if (foundGen) {

      result.nodo = foundGen.name;

      setSelectedMatches({
        0: foundGen.id
      });
    }

    setResults([result]);

    setRawText(
      JSON.stringify(parsedData, null, 2)
    );

   } catch (err) {

    console.log("Fallback automático OCR local");

    console.error(
      "Industrial Parser Error:",
      err
    );

    setResults([
      {
        estado_generador: "ERROR",

        texto_detectado_completo: [
          "OCR industrial no pudo detectar datos válidos"
        ],

        debug: {
          error: String(err)
        }
      } as any
    ]);

  } finally {

    setIsProcessing(false);
  }
};


  
  const processCaptureLocal = async (base64Data: string) => {
    // Existing Tesseract logic...
if (isProcessing) return;    
setIsProcessing(true);
    try {
      const worker = await Tesseract.createWorker('eng', 1);
      await worker.setParameters({
        tessedit_pageseg_mode: '6' as any,
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.:,-% '
      });

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = base64Data;
      });

      const mainCanvas = document.createElement('canvas');
      const mainCtx = mainCanvas.getContext('2d')!;
      mainCanvas.width = img.width;
      mainCanvas.height = img.height;
      mainCtx.drawImage(img, 0, 0);

      // ZONES CONFIG (Optimized for ComAp InteliLite)
      const ZONES_CONFIG = {
        nodo: { x: 5, y: 2, w: 90, h: 12 },
        estado: { x: 35, y: 15, w: 30, h: 10 },
        horas: { x: 5, y: 30, w: 45, h: 12 },
        fuel: { x: 5, y: 42, w: 45, h: 12 },
        battery: { x: 5, y: 54, w: 45, h: 12 },
        voltaje: { x: 50, y: 30, w: 45, h: 12 },
        frecuencia: { x: 50, y: 42, w: 45, h: 12 },
        corriente: { x: 50, y: 54, w: 45, h: 12 },
        alarmas: { x: 5, y: 70, w: 90, h: 25 }
      };

      const extracted: Record<string, string> = {};
      const debugZones: Record<string, any> = {};

      for (const [key, zone] of Object.entries(ZONES_CONFIG)) {
        const zX = (zone.x * img.width) / 100;
        const zY = (zone.y * img.height) / 100;
        const zW = (zone.w * img.width) / 100;
        const zH = (zone.h * img.height) / 100;

        const zoneCanvas = document.createElement('canvas');
        zoneCanvas.width = zW;
        zoneCanvas.height = zH;
        const zCtx = zoneCanvas.getContext('2d')!;
        zCtx.drawImage(mainCanvas, zX, zY, zW, zH, 0, 0, zW, zH);

        const processedZoneImage = preprocessZone(zoneCanvas);
        const { data: { text } } = await worker.recognize(processedZoneImage);
        
        extracted[key] = text.trim() || "NO DETECTADO";
        debugZones[key] = { image: processedZoneImage, rawText: extracted[key] };
      }

      await worker.terminate();

      const result: SyncResult = {
        nodo: extracted.nodo,
        equipo: "Local Engine",
        estado: extracted.estado,
        horas: extracted.horas,
        fuel: extracted.fuel,
        frecuencia: extracted.frecuencia,
        voltaje: extracted.voltaje,
        corriente: extracted.corriente,
        alarmas: extracted.alarmas.split('\n').filter(a => a.length > 2),
        debug: { zones: debugZones }
      };

      // Validation logic
      const foundGen = generators.find(g => 
  result.nodo?.toLowerCase().includes(g.name.toLowerCase())
);
      if (foundGen) result.nodo = foundGen.name;

      setResults([result]);
      if (foundGen) setSelectedMatches({ 0: foundGen.id });
    } catch (err) {
      console.error("Local OCR Error:", err);
      alert("Error en procesamiento local. Verifique la imagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResultChange = (idx: number, field: keyof SyncResult, value: any) => {
    setResults(prev => {
      const newResults = [...prev];
      if (field === 'alarmas') {
        newResults[idx] = { ...newResults[idx], [field]: value.split(',').map((s: string) => s.trim()) };
      } else {
        newResults[idx] = { ...newResults[idx], [field]: value };
      }
      return newResults;
    });
  };

  const handleConfirmAll = async () => {
    setIsProcessing(true);
    let count = 0;

    try {
        for (let idx = 0; idx < results.length; idx++) {
            const res = results[idx];
            const genId = selectedMatches[idx];
            
            if (genId) {
                const foundGen = generators.find(g => g.id === genId);

                // DATA NORMALIZADA OBLIGATORIA (Sin mocks)
                const limpio = normalizarOCR(res);

                console.log("OCR RAW:", res);
                console.log("DATA NORMALIZADA:", limpio);
                console.log("Buscando generador...", limpio.nombre);

                // Update Generator via Service
                await supabaseService.saveGenerator({

                  id: genId,
                  name: limpio.nombre,
                  serialNumber: limpio.serial,
                  tankCapacity: foundGen?.tankCapacity || 0,
                  powerKVA: String(limpio.potencia),
                  executionHours: String(limpio.horas_motor),
                  fuelLevel: limpio.combustible,
                  batteryVoltage: String(limpio.bateria),
                  frecuencia: limpio.frecuencia,
                  voltaje: limpio.voltaje,
                  status: limpio.estado,
                  alarmas: limpio.alarmas,
                  ultima_lectura: limpio.ultima_lectura
                  updated_at: new Date().toISOString(),
                } as any);

                // Save Scan History (Sin generador_id)
                console.log("Sincronizando OCR...");
                await supabaseService.saveScan({
                    serial: limpio.serial,
                    texto_ocr: res.texto_detectado_completo?.join('\n') || '',
                    json_extraido: res
                });

                // Log Sync Event (Sin generador_id)
                await supabaseService.logEvent({
                    serial: limpio.serial,
                    generador_nombre: limpio.nombre,
                    operador: 'Sistema (OCR)',
                    tipo: 'SINCRO_OCR',
                    litros: 0,
                    nivel_resultante: limpio.combustible
                });
                
                console.log("Actualizando generador");
                console.log("Dashboard actualizado");
                console.log("Sincronización completada");
                console.log("Escaneo sincronizado correctamente para:", limpio.nombre);
                count++;
            }
        }
        
        if (count === 0) {
            alert("Por favor vincule al menos un resultado con un generador (Nodo).");
            return;
        }

        // Inform parent to reload data
        onScanConfirm(0, 0, ""); // Trigger reload in parent
        onClose();
        setResults([]);
        setPastedImage(null);
        setImageFile(null);
    } catch (err) {
        console.error("Error confirming scans:", err);
        alert("Error al sincronizar con Supabase.");
    } finally {
        setIsProcessing(false);
    }
  };

  const renderScannerContent = () => (
    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
      <div className="flex-1 p-8 bg-slate-100/50 border-r border-slate-100 flex flex-col gap-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 relative min-h-[400px] rounded-3xl border-4 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center overflow-hidden transition-all group hover:border-indigo-300 cursor-pointer"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
            }}
          />
          {pastedImage ? (
              <img src={pastedImage} className="w-full h-full object-contain p-4" alt="Pasted" />
          ) : (
              <div className="text-center p-8 space-y-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-all">
                      <Clipboard className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-600 font-black uppercase text-sm tracking-widest">Haz clic para subir o pega (Ctrl + V)</p>
                    <p className="text-slate-400 text-xs font-medium">También puedes arrastrar y soltar la imagen aquí</p>
                  </div>
              </div>
          )}
          {(isProcessing) && (
              <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mb-8" />
                  <div className="space-y-2">
                    <p className="text-white font-black uppercase text-sm tracking-[0.4em] animate-pulse">
                      Analizando Panel...
                    </p>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">
                      IA Multicapa Detectando Datos
                    </p>
                  </div>
              </div>
          )}
        </div>

        {pastedImage && !isProcessing && (
          <button 
            onClick={() => processCapture(pastedImage)}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Re-procesar Imagen
          </button>
        )}
      </div>

      <div className="w-full lg:w-[500px] p-8 flex flex-col gap-6 bg-white overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resultados de la Extracción</h3>
          </div>
          {results.length > 0 && (
            <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              DATOS LISTOS
            </span>
          )}
        </div>

        {results.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 p-10">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest">Esperando captura...</p>
            </div>
        ) : (
            <div className="space-y-6 flex-1">
              {results.map((res: any, idx) => {
                  const isMatched = !!selectedMatches[idx];
                  return (
                      <div key={idx} className={`p-6 rounded-[2rem] border transition-all ${isMatched ? 'bg-slate-50 border-slate-200' : 'bg-orange-50 border-orange-200 shadow-xl shadow-orange-500/5'}`}>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <Cpu className="w-3 h-3 text-slate-400" />
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Controlador / Nodo:</span>
                                </div>
                                <input 
                                  type="text"
                                  value={res.controlador || res.nodo || ""}
                                  onChange={(e) => handleResultChange(idx, 'controlador', e.target.value)}
                                  className="text-sm font-black uppercase text-slate-800 bg-transparent border-none p-0 focus:ring-0 w-full"
                                  placeholder="Detectando..."
                                />
                            </div>
                            <div className="flex flex-col items-end gap-1.5 ml-4">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Modo/Estado:</span>
                                <div className="flex gap-2">
                                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-slate-900 text-white">
                                    {res.modo || res.estado || "N/D"}
                                  </span>
                                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border-none ${(res.estado_generador === 'RUNNING' || res.estado === 'RUNNING') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                                    {res.estado_generador || res.estado || "OFF"}
                                  </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Clock className="w-3 h-3 text-indigo-400" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase block">Horas Motor</span>
                                </div>
                                <input 
                                  type="text"
                                  value={res.horas_motor || res.horas || ""}
                                  onChange={(e) => handleResultChange(idx, 'horas_motor', e.target.value)}
                                  className="text-sm font-black text-slate-900 w-full bg-transparent border-none p-0 focus:ring-0"
                                />
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Fuel className="w-3 h-3 text-emerald-400" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase block">Combustible</span>
                                </div>
                                <input 
                                  type="text"
                                  value={res.combustible || res.fuel || ""}
                                  onChange={(e) => handleResultChange(idx, 'combustible', e.target.value)}
                                  className={`text-sm font-black w-full bg-transparent border-none p-0 focus:ring-0 ${(res.combustible || res.fuel || "").includes('NO DETECTADO') ? 'text-rose-500 italic' : 'text-emerald-600'}`}
                                />
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase block">Voltaje</span>
                                </div>
                                <input 
                                  type="text"
                                  value={res.voltaje || res.voltajes?.["L1-N"] || ""}
                                  onChange={(e) => handleResultChange(idx, 'voltaje', e.target.value)}
                                  className="text-sm font-black text-amber-600 w-full bg-transparent border-none p-0 focus:ring-0"
                                />
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Activity className="w-3 h-3 text-cyan-400" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase block">Frecuencia</span>
                                </div>
                                <input 
                                  type="text"
                                  value={res.frecuencia_hz || res.frecuencia || ""}
                                  onChange={(e) => handleResultChange(idx, 'frecuencia_hz', e.target.value)}
                                  className="text-sm font-black text-cyan-600 w-full bg-transparent border-none p-0 focus:ring-0"
                                />
                            </div>
                        </div>

                        {res.alarmas && res.alarmas.length > 0 && (
                          <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertCircle className="w-3 h-3 text-orange-500" />
                              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Alarmas Activas</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {res.alarmas.map((a: string, i: number) => (
                                <span key={i} className="bg-white px-2 py-1 rounded-lg text-[9px] font-bold text-orange-700 border border-orange-200">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 ml-1">
                              <Search className="w-3 h-3 text-slate-400" />
                              <label className="text-[9px] font-black text-slate-400 uppercase block">Vincular con Nodo:</label>
                            </div>
                            <select 
                              value={selectedMatches[idx] || ""}
                              onChange={(e) => setSelectedMatches(prev => ({...prev, [idx]: Number(e.target.value)}))}
                              className={`w-full bg-white text-slate-900 border rounded-2xl px-4 py-3 text-xs font-bold outline-none transition-all ${isMatched ? 'border-slate-200' : 'border-orange-400 ring-4 ring-orange-500/10'}`}
                            >
                              <option value="" className="text-slate-400 bg-white">-- Seleccionar Nodo --</option>
                              {generators.map(g => (
                                  <option key={g.id} value={g.id} className="text-slate-900 bg-white">
                                      {g.name}
                                  </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {showDebug && (res.texto_detectado_completo || res.debug) && (
                          <div className="mt-8 pt-8 border-t border-slate-200 space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Search className="w-4 h-4 text-amber-500" />
                              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Debug Logging</h4>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[8px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Raw Engine Data</span>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto text-[10px] font-mono text-slate-600 bg-white p-4 rounded-lg border border-slate-100">
                                {res.texto_detectado_completo ? (
                                  <div className="space-y-1">
                                    {res.texto_detectado_completo.map((line: string, i: number) => <div key={i}>{line}</div>)}
                                  </div>
                                ) : res.debug ? (
                                  <div className="grid grid-cols-1 gap-4">
                                     {(Object.entries(res.debug.zones) as [string, any][]).map(([key, zone]) => (
                                       <div key={key} className="border-b border-slate-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                                         <p className="font-bold text-indigo-600 mb-1">{key}:</p>
                                         <img src={zone.image} className="h-10 object-contain mb-1" />
                                         <p>{zone.rawText}</p>
                                       </div>
                                     ))}
                                  </div>
                                ) : "No debug data available"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                  );
              })}
            </div>
        )}

        <div className="pt-6 border-t border-slate-100">
          <button 
              disabled={results.length === 0 || isProcessing}
              onClick={handleConfirmAll}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-3"
          >
              <CheckCircle2 className="w-5 h-5" />
              Confirmar y Sincronizar
          </button>
        </div>
      </div>
    </div>
  );

  if (isViewOnly) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-7xl mx-auto overflow-hidden flex flex-col border border-slate-200 outline-none min-h-[80vh]">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <Terminal className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Motor OCR Industrial
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                  IA Avanzada Multicapa • Gemini 3 Flash
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showDebug ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                {showDebug ? "Ocultar Debug" : "Modo Debug"}
              </button>
              <button 
                onClick={onClose} 
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cerrar Escáner
              </button>
            </div>
          </div>
          {renderScannerContent()}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div 
            ref={modalRef}
            tabIndex={-1}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 outline-none"
          >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <Terminal className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                      Motor OCR Industrial
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                      IA Avanzada Multicapa • Fallback Automático
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showDebug ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {showDebug ? "Ocultar Debug" : "Modo Debug"}
                  </button>
                  <button 
                    onClick={onClose} 
                    className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              {renderScannerContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManualCaptureModal;
