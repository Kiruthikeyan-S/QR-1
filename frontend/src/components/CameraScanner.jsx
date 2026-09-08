import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, AlertTriangle, Flashlight, Power, Video, VideoOff } from 'lucide-react';

export const CameraScanner = ({ onScanSuccess, onError }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef(null);
  const isStartingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length) {
          setCameras(devices);
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMessage('No camera devices detected.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(
          `Camera error: ${err.message || 'Please allow camera access in browser permissions.'}`
        );
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && selectedCameraId && !isScanning && !isStartingRef.current) {
      startScanner(selectedCameraId);
    } else if (!isCameraActive && isScanning) {
      stopScanner();
    }
  }, [isCameraActive, selectedCameraId]);

  const startScanner = async (cameraId) => {
    if (isStartingRef.current || isScanning) return;
    isStartingRef.current = true;
    setErrorMessage(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('camera-reader-viewport', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.AZTEC,
          ],
          verbose: false,
        });
      }

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edgeSize = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
          return { width: edgeSize, height: edgeSize };
        },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
      isStartingRef.current = false;

      try {
        const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
        if (capabilities && capabilities.torchFeature && capabilities.torchFeature().isSupported()) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      isStartingRef.current = false;
      setIsScanning(false);
      const msg = err?.message || 'Unable to start camera stream.';
      setErrorMessage(msg);
      if (onError) onError(msg);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        setIsScanning(false);
        setTorchOn(false);
        setHasTorch(false);
      }
    }
  };

  const handleToggleCameraPower = () => {
    if (isCameraActive) {
      setIsCameraActive(false);
      stopScanner();
    } else {
      setIsCameraActive(true);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  const handleScanSuccess = async (rawText) => {
    try {
      if (navigator.vibrate) navigator.vibrate(60);
    } catch {}

    await stopScanner();
    setIsCameraActive(false);
    onScanSuccess(rawText);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md relative">
        {/* Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          {/* ON / OFF Power Switch Button */}
          <button
            onClick={handleToggleCameraPower}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isCameraActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Camera: {isCameraActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Right Tools */}
          <div className="flex items-center gap-2">
            {isCameraActive && hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg text-xs transition ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
                title="Toggle Torch"
              >
                <Flashlight className="w-3.5 h-3.5" />
              </button>
            )}

            {isCameraActive && cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  const newId = e.target.value;
                  stopScanner().then(() => {
                    setSelectedCameraId(newId);
                    if (isCameraActive) startScanner(newId);
                  });
                }}
                className="bg-slate-200 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1 focus:outline-none max-w-[130px] truncate font-medium"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative w-full aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
          {isCameraActive ? (
            <>
              <div id="camera-reader-viewport" className="w-full h-full overflow-hidden" />

              {/* Clean Target Frame */}
              {isScanning && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative w-56 h-56 border-2 border-emerald-500/80 rounded-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center z-20">
                  <AlertTriangle className="w-6 h-6 text-rose-400 mb-2" />
                  <p className="text-xs text-slate-200 max-w-xs mb-3">{errorMessage}</p>
                  <button
                    onClick={() => startScanner(selectedCameraId)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <VideoOff className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Camera is Turned Off</p>
                <p className="text-xs text-slate-400 mt-0.5">Click Turn On Camera to start scanning</p>
              </div>
              <button
                onClick={() => setIsCameraActive(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Video className="w-4 h-4" />
                <span>Turn On Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
          {isCameraActive ? 'Position the QR code inside the frame' : 'Camera stream is stopped'}
        </div>
      </div>
    </div>
  );
};
