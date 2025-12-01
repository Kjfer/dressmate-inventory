import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileDown, Truck, CheckCircle, Camera } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { QRScanner } from "@/components/QRScanner";

const mockOrderDetails = {
  id: "PED-001",
  cliente: "María González",
  telefono: "555-0101",
  direccion: "Calle Principal 123, Ciudad",
  fecha: "2025-12-01",
  estado: "Pendiente de Alistamiento",
  items: [
    {
      id: 1,
      imei: "VES-2025-001",
      nombre: "Vestido Elegante Azul",
      talla: "M",
      cantidadSolicitada: 2,
      asignados: 1,
      qrCodes: [""],
    },
    {
      id: 2,
      imei: "VES-2025-002",
      nombre: "Vestido Cocktail Negro",
      talla: "L",
      cantidadSolicitada: 1,
      asignados: 0,
      qrCodes: [""],
    },
  ],
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState(mockOrderDetails);
  const [scanningForItem, setScanningForItem] = useState<number | null>(null);

  const handleMarkAsReady = () => {
    toast({
      title: "Pedido Alistado",
      description: "El pedido está listo para ser enviado",
    });
  };

  const handleMarkAsSent = () => {
    toast({
      title: "Pedido Enviado",
      description: "Se ha marcado el pedido como enviado",
    });
    navigate("/pedidos");
  };

  const handleQRScan = (decodedText: string, itemId: number) => {
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            asignados: Math.min(item.asignados + 1, item.cantidadSolicitada),
            qrCodes: [...item.qrCodes, decodedText],
          };
        }
        return item;
      }),
    }));

    toast({
      title: "Vestido Asignado",
      description: `Código QR escaneado: ${decodedText}`,
    });

    setScanningForItem(null);
  };

  const getItemStatus = (asignados: number, solicitados: number) => {
    if (asignados === 0)
      return {
        text: "Pendiente",
        color: "bg-warning/10 text-warning border-warning/20",
      };
    if (asignados < solicitados)
      return {
        text: "Parcial",
        color: "bg-primary/10 text-primary border-primary/20",
      };
    return {
      text: "Asignado",
      color: "bg-success/10 text-success border-success/20",
    };
  };

  return (
    <div className="space-y-6">
      {scanningForItem !== null && (
        <QRScanner
          onScan={(code) => handleQRScan(code, scanningForItem)}
          onClose={() => setScanningForItem(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/pedidos")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Pedidos
          </Button>
          <h1 className="text-3xl font-bold">Detalle del Pedido {id}</h1>
          <p className="text-muted-foreground mt-1">
            Asignar vestidos y preparar para envío
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{order.cliente}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{order.telefono}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dirección</p>
              <p className="font-medium">{order.direccion}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Pedido</p>
              <p className="font-medium">{order.fecha}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge
              variant="outline"
              className="bg-warning/10 text-warning border-warning/20"
            >
              {order.estado}
            </Badge>
            <div className="space-y-2">
              <Button className="w-full" onClick={handleMarkAsReady}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Alistado
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleMarkAsSent}
              >
                <Truck className="h-4 w-4 mr-2" />
                Marcar como Enviado
              </Button>
              <Button className="w-full" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Exportar a Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asignación de Vestidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IMEI</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Talla</TableHead>
                <TableHead>Solicitados</TableHead>
                <TableHead>Asignados</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const status = getItemStatus(
                  item.asignados,
                  item.cantidadSolicitada
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.imei}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.talla}</Badge>
                    </TableCell>
                    <TableCell>{item.cantidadSolicitada}</TableCell>
                    <TableCell>{item.asignados}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.color}>
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScanningForItem(item.id)}
                          disabled={
                            item.asignados >= item.cantidadSolicitada
                          }
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Escanear QR
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
