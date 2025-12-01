import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, MapPin, User, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const mockTripDetails = {
  "VIA-001": {
    id: "VIA-001",
    numeroViaje: "VIA-001",
    pedidoId: "PED-001",
    cliente: {
      nombre: "María González",
      telefono: "555-0101",
      direccion: "Calle Principal 123, Ciudad",
    },
    tipo: "Entrega Inicial",
    motorizado: {
      nombre: "Carlos Pérez",
      telefono: "555-1001",
      vehiculo: "Moto Yamaha 150cc - Placa ABC-123",
    },
    estado: "En Camino",
    fechaEnvio: "2025-12-01",
    fechaRetorno: null,
    fechaRealEnvio: "2025-12-01 09:30 AM",
    fechaRealRetorno: null,
    observaciones: "Cliente solicitó entrega en horario de tarde",
    productos: [
      { id: "1", qrCode: "QR-VES-001-M-001", imei: "VES-2025-001", nombre: "Vestido Elegante Azul", talla: "M", tipo: "envio" },
      { id: "2", qrCode: "QR-VES-001-M-002", imei: "VES-2025-001", nombre: "Vestido Elegante Azul", talla: "M", tipo: "envio" },
    ],
  },
  "VIA-002": {
    id: "VIA-002",
    numeroViaje: "VIA-002",
    pedidoId: "PED-002",
    cliente: {
      nombre: "Ana Torres",
      telefono: "555-0102",
      direccion: "Avenida Central 456, Ciudad",
    },
    tipo: "Entrega Inicial",
    motorizado: {
      nombre: "Luis Martínez",
      telefono: "555-1002",
      vehiculo: "Moto Honda 125cc - Placa XYZ-456",
    },
    estado: "Programado",
    fechaEnvio: "2025-12-01",
    fechaRetorno: null,
    fechaRealEnvio: null,
    fechaRealRetorno: null,
    observaciones: null,
    productos: [
      { id: "3", qrCode: "QR-VES-002-L-001", imei: "VES-2025-002", nombre: "Vestido Cocktail Negro", talla: "L", tipo: "envio" },
    ],
  },
  "VIA-003": {
    id: "VIA-003",
    numeroViaje: "VIA-003",
    pedidoId: "PED-003",
    cliente: {
      nombre: "Carmen Silva",
      telefono: "555-0103",
      direccion: "Calle Norte 789, Ciudad",
    },
    tipo: "Cambio/Entallado",
    motorizado: {
      nombre: "Jorge Díaz",
      telefono: "555-1003",
      vehiculo: "Moto Suzuki 110cc - Placa DEF-789",
    },
    estado: "Entregado",
    fechaEnvio: "2025-11-30",
    fechaRetorno: "2025-12-01",
    fechaRealEnvio: "2025-11-30 10:00 AM",
    fechaRealRetorno: "2025-12-01 02:30 PM",
    observaciones: "Cambio de talla M a L. Cliente muy satisfecha con el servicio.",
    productos: [
      { id: "4", qrCode: "QR-VES-001-L-003", imei: "VES-2025-001", nombre: "Vestido Elegante Azul", talla: "L", tipo: "envio" },
      { id: "5", qrCode: "QR-VES-001-M-003", imei: "VES-2025-001", nombre: "Vestido Elegante Azul", talla: "M", tipo: "devolucion" },
    ],
  },
};

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trip, setTrip] = useState(mockTripDetails[id as keyof typeof mockTripDetails]);
  const [observaciones, setObservaciones] = useState(trip?.observaciones || "");

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Viaje No Encontrado</h2>
            <p className="text-muted-foreground mb-4">
              No se encontró información del viaje {id}
            </p>
            <Button onClick={() => navigate("/viajes")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Viajes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleMarkAsDelivered = () => {
    setTrip({ ...trip, estado: "Entregado" });
    toast({
      title: "Viaje Completado",
      description: "El viaje ha sido marcado como entregado",
    });
  };

  const handleMarkAsReturned = () => {
    setTrip({ ...trip, estado: "Con Devolución" });
    toast({
      title: "Devolución Registrada",
      description: "Se ha registrado la devolución de productos",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Programado":
        return "bg-muted text-muted-foreground";
      case "En Camino":
        return "bg-primary/10 text-primary border-primary/20";
      case "Entregado":
        return "bg-success/10 text-success border-success/20";
      case "Con Devolución":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTripTypeColor = (tipo: string) => {
    return tipo === "Entrega Inicial"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-warning/10 text-warning border-warning/20";
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate("/viajes")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Viajes
        </Button>
        <h1 className="text-3xl font-bold">Detalle del Viaje {trip.numeroViaje}</h1>
        <p className="text-muted-foreground mt-1">
          Información completa del viaje y productos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{trip.cliente.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{trip.cliente.telefono}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dirección de Entrega</p>
              <p className="font-medium flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                {trip.cliente.direccion}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pedido Relacionado</p>
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => navigate(`/pedidos/${trip.pedidoId}`)}
              >
                {trip.pedidoId}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Motorizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Motorizado</p>
              <p className="font-medium">{trip.motorizado.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{trip.motorizado.telefono}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vehículo</p>
              <p className="font-medium">{trip.motorizado.vehiculo}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Estado del Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipo de Viaje</p>
              <Badge variant="outline" className={getTripTypeColor(trip.tipo)}>
                {trip.tipo}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estado Actual</p>
              <Badge variant="outline" className={getStatusColor(trip.estado)}>
                {trip.estado}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Fecha de Envío</p>
              <p className="font-medium">{trip.fechaEnvio}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Hora Real de Salida</p>
              <p className="font-medium">
                {trip.fechaRealEnvio || <span className="text-muted-foreground">Pendiente</span>}
              </p>
            </div>
            {trip.fechaRetorno && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha de Retorno</p>
                <p className="font-medium">{trip.fechaRetorno}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={handleMarkAsDelivered}
              disabled={trip.estado === "Entregado" || trip.estado === "Con Devolución"}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como Entregado
            </Button>
            {trip.tipo === "Cambio/Entallado" && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleMarkAsReturned}
                disabled={trip.estado === "Entregado" || trip.estado === "Con Devolución"}
              >
                <Package className="h-4 w-4 mr-2" />
                Registrar Devolución
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos del Viaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código QR</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Talla</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trip.productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-mono text-xs">
                    {producto.qrCode}
                  </TableCell>
                  <TableCell className="font-medium">{producto.imei}</TableCell>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{producto.talla}</Badge>
                  </TableCell>
                  <TableCell>
                    {producto.tipo === "envio" ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Envío
                      </Badge>
                    ) : (
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        Devolución
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Agregar notas sobre el viaje..."
            rows={4}
          />
          <Button className="mt-4" onClick={() => {
            setTrip({ ...trip, observaciones });
            toast({
              title: "Observaciones Guardadas",
              description: "Las notas del viaje han sido actualizadas",
            });
          }}>
            Guardar Observaciones
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripDetail;
