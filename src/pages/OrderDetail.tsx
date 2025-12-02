import { useState, useEffect } from "react";
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
import { ArrowLeft, FileDown, Truck, CheckCircle, Camera, Package, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { QRScanner } from "@/components/QRScanner";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  id: string;
  product_id: string;
  dress_unit_id: string | null;
  requested_size: string;
  rental_price: number;
  notes: string | null;
  product: {
    id: string;
    code: string;
    name: string;
  };
  dress_unit: {
    id: string;
    qr_code: string;
    sku: string;
  } | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  event_date: string;
  delivery_date: string;
  return_date: string;
  delivery_address: string;
  delivery_district: string | null;
  total: number;
  client: {
    id: string;
    full_name: string;
    phone: string;
    address: string;
  };
}

interface GroupedItem {
  product_id: string;
  product_code: string;
  product_name: string;
  requested_size: string;
  total_requested: number;
  assigned_count: number;
  items: OrderItem[];
}

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  useEffect(() => {
    // Group items by product and size
    const grouped = orderItems.reduce((acc, item) => {
      const key = `${item.product_id}-${item.requested_size}`;
      if (!acc[key]) {
        acc[key] = {
          product_id: item.product_id,
          product_code: item.product?.code || '',
          product_name: item.product?.name || '',
          requested_size: item.requested_size,
          total_requested: 0,
          assigned_count: 0,
          items: [],
        };
      }
      acc[key].total_requested += 1;
      if (item.dress_unit_id) {
        acc[key].assigned_count += 1;
      }
      acc[key].items.push(item);
      return acc;
    }, {} as Record<string, GroupedItem>);

    setGroupedItems(Object.values(grouped));
  }, [orderItems]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order with client
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (orderError) throw orderError;
      
      if (!orderData) {
        toast({
          title: "Pedido no encontrado",
          description: "El pedido solicitado no existe",
          variant: "destructive",
        });
        navigate('/pedidos');
        return;
      }

      setOrder(orderData as Order);

      // Fetch order items with products and dress units
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(*),
          dress_unit:dress_units(*)
        `)
        .eq('order_id', id);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData as OrderItem[]);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    if (!order) return;
    
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('assign_dress_unit_by_qr', {
        p_qr_code: qrCode,
        p_order_id: order.id,
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        error?: string;
        message?: string;
        product_name?: string;
        assigned_count?: number;
        total_count?: number;
        is_complete?: boolean;
      };

      if (result.success) {
        toast({
          title: "Vestido Asignado",
          description: `${result.product_name}: ${result.assigned_count}/${result.total_count} ${result.is_complete ? '✓ Completo' : ''}`,
        });
        
        // Refresh order items
        await fetchOrderDetails();
        
        // Keep scanner open if there are more items to assign
        const hasMoreToAssign = groupedItems.some(
          g => g.assigned_count < g.total_requested
        );
        
        if (!hasMoreToAssign || result.is_complete) {
          // Check if all items are complete
          const allComplete = groupedItems.every(
            g => g.assigned_count >= g.total_requested || 
                 (g.product_id === result.product_name && result.is_complete)
          );
          
          if (allComplete) {
            setIsScanning(false);
            toast({
              title: "Pedido Completo",
              description: "Todos los vestidos han sido asignados",
            });
          }
        }
      } else {
        toast({
          title: "Error al asignar",
          description: result.error || "No se pudo asignar el vestido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error assigning dress unit:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar el código QR",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  type OrderStatus = 'pending' | 'confirmed' | 'in_preparation' | 'ready' | 'delivered' | 'returned' | 'cancelled';
  
  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus });
      toast({
        title: "Estado actualizado",
        description: `El pedido ahora está: ${getStatusLabel(newStatus)}`,
      });

      if (newStatus === 'delivered') {
        navigate('/pedidos');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      in_preparation: 'En Preparación',
      ready: 'Listo para Envío',
      delivered: 'Entregado',
      returned: 'Devuelto',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      confirmed: 'bg-primary/10 text-primary border-primary/20',
      in_preparation: 'bg-primary/10 text-primary border-primary/20',
      ready: 'bg-success/10 text-success border-success/20',
      delivered: 'bg-success/10 text-success border-success/20',
      returned: 'bg-muted text-muted-foreground',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status] || 'bg-muted';
  };

  const getItemStatus = (assigned: number, total: number) => {
    if (assigned === 0) return { text: 'Pendiente', color: 'bg-warning/10 text-warning border-warning/20' };
    if (assigned < total) return { text: 'Parcial', color: 'bg-primary/10 text-primary border-primary/20' };
    return { text: 'Completo', color: 'bg-success/10 text-success border-success/20' };
  };

  const totalAssigned = groupedItems.reduce((sum, g) => sum + g.assigned_count, 0);
  const totalRequested = groupedItems.reduce((sum, g) => sum + g.total_requested, 0);
  const allAssigned = totalAssigned === totalRequested && totalRequested > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pedido no encontrado</p>
        <Button onClick={() => navigate('/pedidos')} className="mt-4">
          Volver a Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isScanning && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setIsScanning(false)}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => navigate("/pedidos")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Pedidos
          </Button>
          <h1 className="text-3xl font-bold">Pedido {order.order_number}</h1>
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
              <p className="font-medium">{order.client?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{order.client?.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dirección de Entrega</p>
              <p className="font-medium">{order.delivery_address}</p>
              {order.delivery_district && (
                <p className="text-sm text-muted-foreground">{order.delivery_district}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha del Evento</p>
              <p className="font-medium">{new Date(order.event_date).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {totalAssigned}/{totalRequested} vestidos asignados
              </span>
            </div>
            
            <div className="space-y-2">
              {!allAssigned && (
                <Button 
                  className="w-full" 
                  onClick={() => setIsScanning(true)}
                  disabled={processing}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Escanear QR para Asignar
                </Button>
              )}
              
              {allAssigned && order.status !== 'ready' && (
                <Button 
                  className="w-full" 
                  onClick={() => handleUpdateStatus('ready' as const)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Listo
                </Button>
              )}
              
              {order.status === 'ready' && (
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => handleUpdateStatus('delivered' as const)}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Marcar como Entregado
                </Button>
              )}
              
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asignación de Vestidos
            </CardTitle>
            {!allAssigned && (
              <Button 
                size="sm" 
                onClick={() => setIsScanning(true)}
                disabled={processing}
              >
                <Camera className="h-4 w-4 mr-2" />
                Escanear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {groupedItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay productos en este pedido
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Solicitados</TableHead>
                  <TableHead>Asignados</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>QR Asignados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedItems.map((group) => {
                  const status = getItemStatus(group.assigned_count, group.total_requested);
                  return (
                    <TableRow key={`${group.product_id}-${group.requested_size}`}>
                      <TableCell className="font-mono text-sm">
                        {group.product_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {group.product_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{group.requested_size}</Badge>
                      </TableCell>
                      <TableCell>{group.total_requested}</TableCell>
                      <TableCell>
                        <span className={group.assigned_count === group.total_requested ? 'text-success font-medium' : ''}>
                          {group.assigned_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {group.items
                            .filter(item => item.dress_unit)
                            .map(item => (
                              <Badge 
                                key={item.id} 
                                variant="secondary" 
                                className="font-mono text-xs"
                              >
                                {item.dress_unit?.qr_code}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
