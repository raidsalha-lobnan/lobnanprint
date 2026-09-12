import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, X, Maximize2, Minimize2, RefreshCw, Sparkles, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { posSound } from '../../utils/audio';

interface PosInlineBarcodeScannerProps {
  isActive?: boolean;
  onScan?: (barcode: string) => void;
  onDetected?: (barcode: string) => void;
  onClose?: () => void;
  onOpenFullModal?: () => void;
  className?: string;
}

export const PosInlineBarcodeScanner: React.FC<PosInlineBarcodeScannerProps> = ({
  isActive = true,
  onScan,
  onDetected,
  onClose,
  onOpenFullModal,
  className = ''
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const sessionCounterRef = useRef<number>(0);
  const containerId = 'pos-inline-camera-viewport';

  // Store latest callbacks in refs to avoid restarting scanner on every parent re-render
  const onScanRef = useRef(onScan);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onScanRef.current = onScan;
    onDetectedRef.current = onDetected;
  });

  const handleBarcodeDecoded = useCallback((rawCode: string) => {
    if (isCooldownRef.current) return;
    const code = rawCode.trim();
    if (!code) return;

    isCooldownRef.current = true;
    setLastScannedCode(code);
    posSound.beep();

    if (onScanRef.current) onScanRef.current(code);
    if (onDetectedRef.current) onDetectedRef.current(code);

    // 1.5 second cooldown between camera scans to prevent double scanning
    setTimeout(() => {
      isCooldownRef.current = false;
    }, 1500);
  }, []);

  const stopScanner = useCallback(async () => {
    // Invalidate any ongoing startScanner session
    sessionCounterRef.current++;
    
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch (e) {
        console.warn('Error stopping inline camera scanner:', e);
      }
    }
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  }, []);

  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    const sessionId = ++sessionCounterRef.current;

    await stopScanner();

    if (!isMountedRef.current || sessionId !== sessionCounterRef.current) {
      return;
    }

    setCameraError(null);

    // Ensure DOM container exists and is mounted
    let containerEl = document.getElementById(containerId);
    if (!containerEl || !containerEl.isConnected) {
      // Wait a tick for DOM to render if component just mounted
      await new Promise(r => setTimeout(r, 100));
      if (!isMountedRef.current || sessionId !== sessionCounterRef.current) return;
      containerEl = document.getElementById(containerId);
      if (!containerEl || !containerEl.isConnected) {
        return;
      }
    }

    try {
      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });
      scannerRef.current = html5QrCode;

      // Query available camera devices if possible
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0 && isMountedRef.current && sessionId === sessionCounterRef.current) {
          setAvailableCameras(devices.map((d, i) => ({
            id: d.id,
            label: d.label || `كاميرا ${i + 1}`
          })));
        }
      } catch {
        // Continue with default facingMode
      }

      // Check cancellation again after getCameras async call
      if (!isMountedRef.current || sessionId !== sessionCounterRef.current) {
        try { await html5QrCode.clear(); } catch {}
        return;
      }

      // Re-verify DOM container is still in the document with non-zero dimensions
      const checkEl = document.getElementById(containerId);
      if (!checkEl || !checkEl.isConnected) {
        try { await html5QrCode.clear(); } catch {}
        return;
      }

      const qrConfig = {
        fps: 10,
        qrbox: 250, // Fixed safe box size, let html5-qrcode handle scaling
        aspectRatio: 1.0 // Square aspect ratio is more widely compatible across devices
      };

      let startedSuccessfully = false;

      if (cameraIdToUse) {
        try {
          await html5QrCode.start(
            cameraIdToUse,
            qrConfig,
            handleBarcodeDecoded,
            () => {}
          );
          startedSuccessfully = true;
        } catch (camErr) {
          console.warn('Failed with selected camera ID, trying defaults...', camErr);
        }
      }

      if (!startedSuccessfully && isMountedRef.current && sessionId === sessionCounterRef.current) {
        try {
          // 1. Try environment camera (ideal for phones / back cameras)
          await html5QrCode.start(
            { facingMode: 'environment' },
            qrConfig,
            handleBarcodeDecoded,
            () => {}
          );
          startedSuccessfully = true;
        } catch (envErr) {
          console.warn('Environment facingMode failed, falling back to user webcam...', envErr);
          if (!isMountedRef.current || sessionId !== sessionCounterRef.current) return;
          try {
            // 2. Try user camera (ideal for desktop / laptop webcams)
            await html5QrCode.start(
              { facingMode: 'user' },
              qrConfig,
              handleBarcodeDecoded,
              () => {}
            );
            startedSuccessfully = true;
          } catch (userErr) {
            console.warn('User facingMode failed, trying getCameras list...', userErr);
            if (!isMountedRef.current || sessionId !== sessionCounterRef.current) return;
            // 3. Try any enumerated device
            const devices = await Html5Qrcode.getCameras().catch(() => []);
            if (devices && devices.length > 0 && isMountedRef.current && sessionId === sessionCounterRef.current) {
              await html5QrCode.start(
                devices[0].id,
                qrConfig,
                handleBarcodeDecoded,
                () => {}
              );
              startedSuccessfully = true;
            } else {
              throw userErr || envErr || new Error('تعذر تشغيل أي كاميرا متوفرة');
            }
          }
        }
      }

      if (startedSuccessfully && isMountedRef.current && sessionId === sessionCounterRef.current) {
        setIsScanning(true);
        setCameraError(null);
      }
    } catch (err: any) {
      if (!isMountedRef.current || sessionId !== sessionCounterRef.current) {
        return;
      }
      console.error('Camera startup error:', err);
      const errMsg = err?.message || String(err || '');
      if (errMsg.includes('Permission') || errMsg.includes('NotAllowedError')) {
        setCameraError('لم يتم منح إذن الوصول إلى الكاميرا. يرجى الضغط على أيقونة الكاميرا/القفل في شريط عنوان المتصفح والسماح بالكاميرا.');
      } else if (errMsg.includes('NotFound') || errMsg.includes('DevicesNotFoundError')) {
        setCameraError('لم يتم العثور على كاميرا متصلة بالجهاز. يمكنك استخدام قارئ الباركود اليدوي USB.');
      } else if (errMsg.includes('NotReadableError') || errMsg.includes('TrackStartError')) {
        setCameraError('الكاميرا قيد الاستخدام بواسطة تطبيق آخر أو متصفح آخر. يرجى إغلاق التطبيقات الأخرى وإعادة المحاولة.');
      } else if (errMsg.includes('clientWidth') || errMsg.includes('not found')) {
        // Container was transitioning or not mounted yet
        console.warn('Camera container DOM not ready during startup.');
      } else {
        setCameraError(`تعذر فتح الكاميرا (${errMsg.substring(0, 60)}...). يمكنك فتح نافذة الكاميرا الكاملة أو استخدام الباركود اليدوي.`);
      }
    }
  }, [handleBarcodeDecoded, stopScanner]);

  useEffect(() => {
    isMountedRef.current = true;

    if (isActive) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          startScanner(selectedCameraId || undefined).catch((err) => {
            console.warn('Silent inline camera startup note:', err);
          });
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isActive, selectedCameraId, startScanner, stopScanner]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  if (!isActive) return null;

  return (
    <div className={`bg-slate-900 text-white rounded-xl border-2 border-blue-500/60 shadow-xl p-2.5 flex flex-col gap-2 ${className}`}>
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-700/80 flex-wrap gap-2">
        <div className="flex items-center gap-2 font-bold text-blue-300">
          <div className="relative">
            <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
            {isScanning && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-xs text-white font-black">ماسح باركود الكاميرا المباشر</span>
          {isScanning ? (
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              جاهزة وتراقب
            </span>
          ) : (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 font-bold">
              جاري التهيئة...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {lastScannedCode && (
            <span className="font-mono text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              آخر كود: {lastScannedCode}
            </span>
          )}

          {/* Camera switcher dropdown if multiple cameras exist */}
          {availableCameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
              }}
              className="bg-slate-800 border border-slate-600 text-slate-200 text-[10px] rounded px-1 py-0.5 cursor-pointer font-sans"
              title="التبديل بين الكاميرات المتوفرة"
            >
              {availableCameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label}
                </option>
              ))}
            </select>
          )}

          {onOpenFullModal && (
            <button
              type="button"
              onClick={onOpenFullModal}
              title="فتح نافذة الكاميرا الكاملة مع الفلاش والخيارات المتقدمة"
              className="px-2 py-1 bg-blue-700/60 hover:bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">نافذة كاملة</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'تصغير المعاينة' : 'تكبير المعاينة'}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => startScanner(selectedCameraId || undefined)}
            title="إعادة تشغيل الكاميرا"
            className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="إغلاق الكاميرا"
              className="p-1 hover:bg-rose-900/60 rounded text-rose-300 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Error Message Banner (if any) */}
      {cameraError && (
        <div className="bg-amber-950/80 border border-amber-500 text-amber-200 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => startScanner(selectedCameraId || undefined)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-[11px] cursor-pointer shadow-xs"
            >
              إعادة المحاولة
            </button>
            {onOpenFullModal && (
              <button
                type="button"
                onClick={onOpenFullModal}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[11px] cursor-pointer shadow-xs"
              >
                النافذة الكاملة
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Camera Viewport (Kept in DOM with min dimensions so html5-qrcode can attach cleanly) */}
      <div className="relative rounded-lg overflow-hidden bg-black border border-slate-700 min-h-[150px]">
        <div
          id={containerId}
          className={`w-full transition-all duration-200 ${isExpanded ? 'min-h-[300px]' : 'min-h-[150px]'}`}
        />
        <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none z-10">
          <span className="bg-slate-900/80 text-[10px] text-slate-200 px-3 py-0.5 rounded-full backdrop-blur-xs font-semibold shadow-xs border border-slate-700/60">
            وجه خطوط الباركود أمام الكاميرا لمسح الصنف تلقائياً وإضافته للفاتورة
          </span>
        </div>
      </div>
    </div>
  );
};


