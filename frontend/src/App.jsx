import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { CameraScanner } from './components/CameraScanner';
import { ResultCard } from './components/ResultCard';
import { QRGeneratorModal } from './components/QRGeneratorModal';
import { parseRawData } from './services/api';
import { AlertCircle } from 'lucide-react';

export function App() {
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          handleReset();
        }}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center">
        {/* Simple Clean Header */}
        {!currentResult && (
          <div className="text-center max-w-md mx-auto mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              QR Code Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload an image or use your camera to scan and read QR codes.
            </p>
          </div>
        )}

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

        {/* View / Result Area */}
        <div className="w-full">
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
      </main>

      {/* Create QR Modal */}
      <QRGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onTestGenerated={(structured) => {
          handleScanSuccess(structured, { type: 'generator' });
        }}
      />
    </div>
  );
}

export default App;
