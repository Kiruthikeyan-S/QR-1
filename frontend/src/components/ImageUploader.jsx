import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { scanImage } from '../services/api';

export const ImageUploader = ({ onScanSuccess, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              processFile(file);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      if (onError) onError('Please upload a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setIsLoading(true);

    try {
      const response = await scanImage(file);
      if (response.success && response.results && response.results.length > 0) {
        onScanSuccess(response.results[0], {
          previewUrl: objectUrl,
          processingTime: response.processing_time_ms,
          metadata: response.image_metadata,
        });
      } else {
        throw new Error(response.message || 'No QR code was found in this image.');
      }
    } catch (err) {
      const msg = err.message || 'Failed to read QR image.';
      if (onError) onError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full aspect-[16/10] rounded-2xl p-8 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center select-none shadow-xs ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/70'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-800">Scanning image...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
              <UploadCloud className="w-7 h-7 text-emerald-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Click to upload, or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP, GIF or paste with <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700">Ctrl+V</kbd>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
