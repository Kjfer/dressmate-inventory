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
import { Plus, Eye, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockTrips = [
  {
    id: "VIA-001",
    pedidoId: "PED-001",
    cliente: "María González",
    direccion: "Calle Principal 123",
    tipo: "Entrega Inicial",
    motorizado: "Carlos Pérez",
    estado: "En Camino",
    fechaEnvio: "2025-12-01",
    fechaRetorno: null,
  },
  {
    id: "VIA-002",
    pedidoId: "PED-002",
    cliente: "Ana Torres",
    direccion: "Avenida Central 456",
    tipo: "Entrega Inicial",
    motorizado: "Luis Martínez",
    estado: "Programado",
    fechaEnvio: "2025-12-01",
    fechaRetorno: null,
  },
  {
    id: "VIA-003",
    pedidoId: "PED-001",
    cliente: "Carmen Silva",
    direccion: "Calle Norte 789",
    tipo: "Cambio/Entallado",
    motorizado: "Jorge Díaz",
    estado: "Entregado",
    fechaEnvio: "2025-11-30",
    fechaRetorno: "2025-12-01",
  },
];

const Trips = () => {
  const navigate = useNavigate();

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Viajes</h1>
          <p className="text-muted-foreground mt-1">
            Programar y seguir entregas diarias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Filtrar por Fecha
          </Button>
          <Button onClick={() => navigate("/viajes/nuevo")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Viaje
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Viajes Programados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Viaje</TableHead>
                <TableHead>ID Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motorizado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Envío</TableHead>
                <TableHead>Fecha Retorno</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.id}</TableCell>
                  <TableCell>{trip.pedidoId}</TableCell>
                  <TableCell>{trip.cliente}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {trip.direccion}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getTripTypeColor(trip.tipo)}
                    >
                      {trip.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{trip.motorizado}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(trip.estado)}
                    >
                      {trip.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>{trip.fechaEnvio}</TableCell>
                  <TableCell>
                    {trip.fechaRetorno || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/viajes/${trip.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Trips;
