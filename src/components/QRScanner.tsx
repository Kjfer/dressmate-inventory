import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Camera, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScanResult {
  qrCode: string;
  success: boolean;
  message: string;
  productoNombre?: string;
  talla?: string;
  asignados?: number;
  solicitados?: number;
}

interface QRScannerProps {
  onScan: (decodedText: string) => Promise<ScanResult>;
  onClose: () => void;
  continuousMode?: boolean;
}

export function QRScanner({ onScan, onClose, continuousMode = true }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const qrCodeRegionId = "qr-reader";
  const cooldownRef = useRef(false);

  const handleScanResult = useCallback(async (decodedText: string) => {
    // Prevent duplicate scans during cooldown
    if (cooldownRef.current || processing) return;
    if (lastScanned === decodedText) return;
    
    cooldownRef.current = true;
    setProcessing(true);
    setLastScanned(decodedText);

    try {
      const result = await onScan(decodedText);
      setScanHistory(prev => [result, ...prev].slice(0, 10));
      
      // Reset cooldown after delay
      setTimeout(() => {
        cooldownRef.current = false;
        setLastScanned(null);
      }, 1500);
      
    } catch (err) {
      console.error("Error processing scan:", err);
    } finally {
      setProcessing(false);
    }
  }, [onScan, lastScanned, processing]);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(qrCodeRegionId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            handleScanResult(decodedText);
          },
          () => {
            // Ignore scan errors, they're normal
          }
        );

        setIsScanning(true);
        setError("");
      } catch (err) {
        console.error("Error starting scanner:", err);
        setError(
          "No se pudo acceder a la cámara. Asegúrate de dar permisos de cámara."
        );
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(console.error);
      }
    };
  }, [handleScanResult]);

  const handleClose = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear();
          setIsScanning(false);
          onClose();
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err);
          onClose();
        });
    } else {
      onClose();
    }
  };

  const successCount = scanHistory.filter(s => s.success).length;
  const errorCount = scanHistory.filter(s => !s.success).length;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escanear QR
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {continuousMode && scanHistory.length > 0 && (
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                {successCount} asignados
              </Badge>
              {errorCount > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  {errorCount} errores
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3 flex-1 overflow-auto">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative">
            <div
              id={qrCodeRegionId}
              className="rounded-lg overflow-hidden border-2 border-primary"
            />
            {processing && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {continuousMode 
              ? "Escanea múltiples códigos QR. Se asignarán automáticamente."
              : "Coloca el código QR dentro del recuadro"
            }
          </p>

          {/* Scan History */}
          {continuousMode && scanHistory.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-auto">
              <p className="text-xs font-medium text-muted-foreground">Historial:</p>
              {scanHistory.map((result, idx) => (
                <div 
                  key={`${result.qrCode}-${idx}`}
                  className={cn(
                    "text-sm p-2 rounded border",
                    result.success 
                      ? "bg-success/5 border-success/20" 
                      : "bg-destructive/5 border-destructive/20"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      {result.success ? (
                        <span className="font-medium">
                          {result.productoNombre} ({result.talla}) - {result.asignados}/{result.solicitados}
                        </span>
                      ) : (
                        <span className="text-destructive">{result.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={handleClose} className="w-full">
            Cerrar Escáner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
