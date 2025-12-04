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
import { Plus, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Orders = () => {
  const navigate = useNavigate();
  const { canManageOrders } = useAuth();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          clientes (nombre, telefono)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "alistado":
        return "bg-success/10 text-success border-success/20";
      case "pendiente":
        return "bg-warning/10 text-warning border-warning/20";
      case "confirmado":
        return "bg-primary/10 text-primary border-primary/20";
      case "enviado":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "entregado":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "cancelado":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendiente: "Pendiente",
      confirmado: "Confirmado",
      alistado: "Alistado",
      enviado: "Enviado",
      entregado: "Entregado",
      cancelado: "Cancelado"
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Ver y administrar pedidos confirmados
          </p>
        </div>
        {canManageOrders && (
          <Button onClick={() => navigate("/pedidos/nuevo")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {pedidos && pedidos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Fecha Evento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-medium">
                      {pedido.numero_pedido || pedido.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{pedido.clientes?.nombre}</TableCell>
                    <TableCell>{pedido.clientes?.telefono}</TableCell>
                    <TableCell>
                      {pedido.fecha_evento 
                        ? new Date(pedido.fecha_evento).toLocaleDateString('es-PE')
                        : '-'}
                    </TableCell>
                    <TableCell>S/ {pedido.total?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(pedido.estado)}
                        variant="outline"
                      >
                        {getStatusLabel(pedido.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/pedidos/${pedido.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay pedidos registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
