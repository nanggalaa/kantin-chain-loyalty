import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, QrCode, Camera, CameraOff } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the parsed tenant_id when a valid QR is detected */
  onScan: (tenantId: string) => void;
}

type ScannerState = "idle" | "starting" | "scanning" | "error";

const SCANNER_ELEMENT_ID = "kantinchain-qr-reader";

/* ─── Component ─────────────────────────────────────────────── */
export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScannerState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const isProcessingRef = useRef(false);

  /* Start scanner when modal opens */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const start = async () => {
      setState("starting");
      setErrorMsg("");

      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (isProcessingRef.current || cancelled) return;
            handleDecoded(decodedText);
          },
          // Per-frame error — ignore silently (not-found is normal noise)
          (_errMsg) => {
            if (/notfound|qr code not found/i.test(_errMsg)) return;
          },
        );

        if (!cancelled) setState("scanning");
      } catch (err: any) {
        if (cancelled) return;
        const msg: string = err?.message ?? String(err);
        if (/permission|denied|notallowed/i.test(msg)) {
          setErrorMsg("Akses kamera ditolak. Izinkan kamera di pengaturan browser.");
        } else if (/notfound|notreadable|overconstrained/i.test(msg)) {
          setErrorMsg("Kamera tidak ditemukan atau tidak dapat diakses.");
        } else {
          setErrorMsg("Gagal membuka kamera. Coba refresh halaman.");
        }
        setState("error");
      }
    };

    start();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopScanner = () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    scanner.isScanning
      ? scanner.stop().catch(() => {}).finally(() => { scanner.clear(); scannerRef.current = null; })
      : (scanner.clear(), (scannerRef.current = null));
  };

  const handleClose = () => {
    stopScanner();
    isProcessingRef.current = false;
    setState("idle");
    setErrorMsg("");
    onClose();
  };

  const handleDecoded = (raw: string) => {
    isProcessingRef.current = true;

    // Support both formats:
    // 1. JSON: {"tenant_id":"<uuid>"}
    // 2. Deep link: kantinchain://tenant/<uuid>
    let tenantId: string | null = null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.tenant_id && typeof parsed.tenant_id === "string") {
        tenantId = parsed.tenant_id.trim();
      }
    } catch {
      // Try deep link format
      const match = raw.match(/^kantinchain:\/\/tenant\/([a-f0-9-]{36})$/i);
      if (match) tenantId = match[1];
    }

    if (!tenantId) {
      isProcessingRef.current = false;
      setErrorMsg("QR tidak valid. Pastikan Anda scan QR dari kantin KantinChain.");
      setState("error");
      stopScanner();
      return;
    }

    stopScanner();
    setState("idle");
    onScan(tenantId);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Scanner QR"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "var(--gradient-solana)" }}
            >
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">Scan QR Kantin</p>
              <p className="text-[11px] text-[#64748B]">Arahkan kamera ke QR tenant</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] transition-colors hover:bg-[#E2E8F0] hover:text-[#0F172A]"
            aria-label="Tutup scanner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-[#0F172A]">
          {/* html5-qrcode mounts video here */}
          <div id={SCANNER_ELEMENT_ID} className="w-full" style={{ minHeight: 300 }} />

          {/* Overlay frame saat scanning */}
          {state === "scanning" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-60 w-60">
                {/* Corner brackets */}
                {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                  <div
                    key={corner}
                    className={`absolute h-8 w-8 border-[3px] border-[#9945FF] ${
                      corner === "tl" ? "top-0 left-0 border-r-0 border-b-0 rounded-tl-lg" :
                      corner === "tr" ? "top-0 right-0 border-l-0 border-b-0 rounded-tr-lg" :
                      corner === "bl" ? "bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg" :
                                        "bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg"
                    }`}
                  />
                ))}
                {/* Scan line animation */}
                <div
                  className="absolute left-2 right-2 h-0.5 rounded-full opacity-80"
                  style={{
                    background: "var(--gradient-solana)",
                    animation: "scanline 2s ease-in-out infinite",
                    top: "50%",
                  }}
                />
              </div>
            </div>
          )}

          {/* Loading state */}
          {state === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0F172A]" style={{ minHeight: 300 }}>
              <div
                className="h-10 w-10 rounded-full border-2 border-transparent border-t-[#9945FF] border-r-[#14F195] animate-spin"
              />
              <p className="text-sm text-white/70">Membuka kamera...</p>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0F172A] px-6 text-center" style={{ minHeight: 300 }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
                <CameraOff className="h-7 w-7 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-white">{errorMsg}</p>
              <button
                onClick={() => {
                  setState("idle");
                  setErrorMsg("");
                  isProcessingRef.current = false;
                  // Re-trigger useEffect by closing+reopening isn't viable here,
                  // so we restart directly
                  const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
                  scannerRef.current = scanner;
                  setState("starting");
                  scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 240, height: 240 } },
                    (txt) => { if (!isProcessingRef.current) handleDecoded(txt); },
                    () => {},
                  ).then(() => setState("scanning")).catch((e: any) => {
                    setErrorMsg(e?.message ?? "Gagal membuka kamera.");
                    setState("error");
                  });
                }}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all"
                style={{ background: "var(--gradient-solana)" }}
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-[#64748B]">
            Pastikan QR kantin terlihat jelas dalam bingkai kamera
          </p>
        </div>
      </div>

      {/* Scanline keyframe */}
      <style>{`
        @keyframes scanline {
          0%   { top: 10%; }
          50%  { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
