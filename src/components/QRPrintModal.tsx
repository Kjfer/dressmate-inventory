import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import QRCode from "react-qr-code";

interface ProductoIndividual {
  id: string;
  qr_code: string;
  talla?: string;
  producto_nombre?: string;
}

interface QRPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: ProductoIndividual[];
  variacionInfo?: {
    producto_nombre: string;
    talla: string;
  };
}

export function QRPrintModal({ 
  open, 
  onOpenChange, 
  productos,
  variacionInfo 
}: QRPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Códigos QR - ${variacionInfo?.producto_nombre || 'Productos'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 10mm;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8mm;
            }
            .qr-item {
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 4mm;
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-code {
              width: 25mm;
              height: 25mm;
              margin: 0 auto 2mm;
            }
            .qr-code svg {
              width: 100%;
              height: 100%;
            }
            .qr-text {
              font-size: 7pt;
              font-family: monospace;
              word-break: break-all;
              margin-bottom: 1mm;
            }
            .product-name {
              font-size: 6pt;
              color: #6b7280;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .talla {
              font-size: 8pt;
              font-weight: bold;
              color: #374151;
            }
            @media print {
              body { padding: 5mm; }
              .grid { gap: 5mm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Imprimir Códigos QR
            {variacionInfo && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {variacionInfo.producto_nombre} - {variacionInfo.talla}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          <div ref={printRef}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {productos.map((producto) => (
                <div 
                  key={producto.id} 
                  className="qr-item border rounded-lg p-3 text-center bg-card"
                >
                  <div className="qr-code flex justify-center mb-2">
                    <QRCode 
                      value={producto.qr_code} 
                      size={80}
                      level="M"
                    />
                  </div>
                  <p className="qr-text text-xs font-mono break-all">
                    {producto.qr_code}
                  </p>
                  {variacionInfo && (
                    <>
                      <p className="talla text-sm font-semibold">
                        {variacionInfo.talla}
                      </p>
                      <p className="product-name text-xs text-muted-foreground truncate">
                        {variacionInfo.producto_nombre}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir ({productos.length} códigos)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
