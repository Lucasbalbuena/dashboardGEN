
import React, { useState } from 'react';

interface GoogleSheetImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (url: string) => Promise<void>;
}

const GoogleSheetImportModal: React.FC<GoogleSheetImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) {
        return null;
    }

    const handleImportClick = async () => {
        if (!url) {
            alert('Por favor, ingrese la URL de la hoja de cálculo.');
            return;
        }
        setIsLoading(true);
        await onImport(url);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Importar desde Google Sheets</h2>
                
                <div className="space-y-4 text-sm text-gray-600">
                    <p>Para importar datos, su hoja de cálculo de Google Sheets debe estar publicada en la web.</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4">
                        <li>Abra su hoja de cálculo de Google Sheets.</li>
                        <li>Vaya al menú: <span className="font-semibold">Archivo &gt; Compartir &gt; Publicar en la web</span>.</li>
                        <li>En la ventana emergente, en la pestaña <span className="font-semibold">Enlace</span>, seleccione la hoja que desea importar.</li>
                        <li>Asegúrese de que el formato sea <span className="font-semibold">Valores separados por comas (.csv)</span>.</li>
                        <li>Haga clic en el botón verde <span className="font-semibold bg-gray-200 px-1 rounded">Publicar</span> y confirme.</li>
                        <li><span className="font-bold text-red-600">IMPORTANTE:</span> Copie el enlace que aparece en el cuadro de texto. ¡No use la URL de la barra de direcciones del navegador!</li>
                         <li>Pegue el enlace copiado en el campo de abajo.</li>
                    </ol>
                    <p className="font-semibold text-gray-700">La hoja debe contener las siguientes columnas: <code className="bg-gray-200 p-1 rounded">Generador</code>, <code className="bg-gray-200 p-1 rounded">Horas de Ejecución</code>, <code className="bg-gray-200 p-1 rounded">Nivel de Combustible</code>, y <code className="bg-gray-200 p-1 rounded">Fecha Última Recarga</code>.</p>
                </div>

                <div className="mt-6">
                    <label htmlFor="sheet-url" className="block text-sm font-medium text-gray-700">URL de publicación de Google Sheets</label>
                    <input
                        id="sheet-url"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Importando...
                            </>
                        ) : 'Importar Datos'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleSheetImportModal;
