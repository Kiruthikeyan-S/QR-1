import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { CameraScanner } from './components/CameraScanner';
import { ResultCard } from './components/ResultCard';
import { ProductImageGenerator } from './components/ProductImageGenerator';
import { TextGeneratorCorrection } from './components/TextGeneratorCorrection';
import { QRGeneratorModal } from './components/QRGeneratorModal';
import { parseRawData } from './services/api';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState('scanner'); // 'scanner' | 'image-gen' | 'text-gen'
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera'
  const [currentResult, setCurrentResult] = useState(null);
  const [scanSource, setScanSource] = useState(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleScanSuccess = async (data, sourceInfo = {}) => {
    setErrorMessage(null);

    // If data is already structured (from ImageUploader API)
    if (data && typeof data === 'object' && data.data_type) {
      setCurrentResult(data);
      setScanSource(sourceInfo);
      return;
    }

    // If data is raw text string (from CameraScanner html5-qrcode)
    if (typeof data === 'string') {
      try {
        const parsed = await parseRawData(data);
        setCurrentResult(parsed);
        setScanSource({ type: 'camera', ...sourceInfo });
      } catch (err) {
        setErrorMessage('Could not parse the scanned QR code.');
      }
    }
  };

  const handleReset = () => {
    setCurrentResult(null);
    setScanSource(null);
    setErrorMessage(null);
  };

  const handleCreateQRFromText = (textPayload) => {
    setIsGeneratorOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Bar with Menu Drawer */}
      <Navbar
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          handleReset();
        }}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col items-center">
        {/* Error Banner */}
        {errorMessage && (
          <div className="w-full max-w-xl mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. VIEW: QR Code Scanner */}
        {currentView === 'scanner' && (
          <div className="w-full">
            {/* Header when on Scanner and no result active */}
            {!currentResult && (
              <div className="flex flex-col items-center mb-6 space-y-3">
                <div className="text-center max-w-md mx-auto">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    QR Code Scanner
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Upload an image or use your camera to scan and read QR codes.
                  </p>
                </div>

                {/* Mode Switcher: Upload Image / Live Camera */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                      activeTab === 'upload'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload Image
                  </button>
                  <button
                    onClick={() => setActiveTab('camera')}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                      activeTab === 'camera'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Live Camera
                  </button>
                </div>
              </div>
            )}

            {currentResult ? (
              <ResultCard
                result={currentResult}
                scanSource={scanSource}
                onReset={handleReset}
              />
            ) : (
              <div className="w-full flex flex-col items-center">
                {activeTab === 'upload' ? (
                  <ImageUploader
                    onScanSuccess={handleScanSuccess}
                    onError={(err) => setErrorMessage(err)}
                  />
                ) : (
                  <CameraScanner
                    onScanSuccess={handleScanSuccess}
                    onError={(err) => setErrorMessage(err)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. VIEW: Product Image Studio */}
        {currentView === 'image-gen' && (
          <ProductImageGenerator onGenerateQR={handleCreateQRFromText} />
        )}

        {/* 3. VIEW: Text Generation & Correction */}
        {currentView === 'text-gen' && (
          <TextGeneratorCorrection onGenerateQR={handleCreateQRFromText} />
        )}
      </main>

      {/* Create QR Modal */}
      <QRGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onTestGenerated={(structured) => {
          setCurrentView('scanner');
          handleScanSuccess(structured, { type: 'generator' });
        }}
      />
    </div>
  );
}

export default App;
