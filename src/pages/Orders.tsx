import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockOrders = [
  {
    id: "PED-001",
    cliente: "María González",
    telefono: "555-0101",
    fecha: "2025-12-01",
    items: 3,
    estado: "Alistado",
  },
  {
    id: "PED-002",
    cliente: "Ana Torres",
    telefono: "555-0102",
    fecha: "2025-12-01",
    items: 2,
    estado: "Pendiente de Alistamiento",
  },
  {
    id: "PED-003",
    cliente: "Carmen Silva",
    telefono: "555-0103",
    fecha: "2025-11-30",
    items: 1,
    estado: "Enviado",
  },
];

const Orders = () => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Alistado":
        return "bg-success/10 text-success border-success/20";
      case "Pendiente de Alistamiento":
        return "bg-warning/10 text-warning border-warning/20";
      case "Enviado":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Ver y administrar pedidos confirmados
          </p>
        </div>
        <Button onClick={() => navigate("/pedidos/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Confirmados del Día</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.cliente}</TableCell>
                  <TableCell>{order.telefono}</TableCell>
                  <TableCell>{order.fecha}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusColor(order.estado)}
                      variant="outline"
                    >
                      {order.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/pedidos/${order.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
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

export default Orders;
