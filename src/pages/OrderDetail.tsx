import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, FileDown, Truck, CheckCircle, Camera, Package, Loader2, Edit, Save, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { QRScanner } from "@/components/QRScanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Variacion {
  id: string;
  talla: string;
  producto: {
    id: string;
    imei: string;
    nombre: string;
  };
}

interface ProductoIndividual {
  id: string;
  qr_code: string;
  estado: string;
}

interface Asignacion {
  id: string;
  producto_individual: ProductoIndividual;
}

interface DetallePedido {
  id: string;
  variacion_id: string;
  cantidad: number;
  precio_unitario: number;
  notas: string | null;
  variacion: Variacion;
  asignaciones: Asignacion[];
}

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  estado: string;
  fecha_pedido: string;
  fecha_evento: string | null;
  fecha_entrega: string | null;
  fecha_devolucion: string | null;
  direccion_entrega: string | null;
  distrito_entrega: string | null;
  referencia_entrega: string | null;
  total: number;
  subtotal: number;
  descuento: number;
  deposito: number;
  deposito_pagado: boolean;
  notas: string | null;
  cliente: Cliente;
}

interface GroupedItem {
  variacion_id: string;
  producto_imei: string;
  producto_nombre: string;
  talla: string;
  cantidad_solicitada: number;
  cantidad_asignada: number;
  qr_asignados: string[];
}

type EstadoPedido = 'pendiente' | 'confirmado' | 'alistado' | 'enviado' | 'entregado' | 'cancelado';

const estadoOptions: { value: EstadoPedido; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'alistado', label: 'Alistado' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canManageOrders } = useAuth();
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    estado: '' as EstadoPedido,
    fecha_evento: '',
    fecha_entrega: '',
    fecha_devolucion: '',
    direccion_entrega: '',
    distrito_entrega: '',
    referencia_entrega: '',
    notas: '',
    descuento: 0,
    deposito: 0,
    deposito_pagado: false,
  });

  useEffect(() => {
    if (id) {
      fetchPedidoDetails();
    }
  }, [id]);

  useEffect(() => {
    const grouped = detalles.map(detalle => ({
      variacion_id: detalle.variacion_id,
      producto_imei: detalle.variacion?.producto?.imei || '',
      producto_nombre: detalle.variacion?.producto?.nombre || '',
      talla: detalle.variacion?.talla || '',
      cantidad_solicitada: detalle.cantidad,
      cantidad_asignada: detalle.asignaciones?.length || 0,
      qr_asignados: detalle.asignaciones?.map(a => a.producto_individual?.qr_code).filter(Boolean) || [],
    }));
    setGroupedItems(grouped);
  }, [detalles]);

  const fetchPedidoDetails = async () => {
    try {
      setLoading(true);
      
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (pedidoError) throw pedidoError;
      
      if (!pedidoData) {
        toast({
          title: "Pedido no encontrado",
          description: "El pedido solicitado no existe",
          variant: "destructive",
        });
        navigate('/pedidos');
        return;
      }

      setPedido(pedidoData as Pedido);

      const { data: detallesData, error: detallesError } = await supabase
        .from('detalle_pedido')
        .select(`
          *,
          variacion:variaciones_producto(
            *,
            producto:productos(*)
          )
        `)
        .eq('pedido_id', id);

      if (detallesError) throw detallesError;

      const detallesConAsignaciones = await Promise.all(
        (detallesData || []).map(async (detalle) => {
          const { data: asignacionesData } = await supabase
            .from('asignacion_productos')
            .select(`
              *,
              producto_individual:productos_individuales(*)
            `)
            .eq('detalle_pedido_id', detalle.id);
          
          return {
            ...detalle,
            asignaciones: asignacionesData || [],
          };
        })
      );

      setDetalles(detallesConAsignaciones as DetallePedido[]);
    } catch (error) {
      console.error('Error fetching pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = () => {
    if (!pedido) return;
    setEditForm({
      estado: pedido.estado as EstadoPedido,
      fecha_evento: pedido.fecha_evento || '',
      fecha_entrega: pedido.fecha_entrega || '',
      fecha_devolucion: pedido.fecha_devolucion || '',
      direccion_entrega: pedido.direccion_entrega || '',
      distrito_entrega: pedido.distrito_entrega || '',
      referencia_entrega: pedido.referencia_entrega || '',
      notas: pedido.notas || '',
      descuento: pedido.descuento || 0,
      deposito: pedido.deposito || 0,
      deposito_pagado: pedido.deposito_pagado || false,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!pedido) return;
    
    try {
      setProcessing(true);
      
      const { error } = await supabase
        .from('pedidos')
        .update({
          estado: editForm.estado,
          fecha_evento: editForm.fecha_evento || null,
          fecha_entrega: editForm.fecha_entrega || null,
          fecha_devolucion: editForm.fecha_devolucion || null,
          direccion_entrega: editForm.direccion_entrega || null,
          distrito_entrega: editForm.distrito_entrega || null,
          referencia_entrega: editForm.referencia_entrega || null,
          notas: editForm.notas || null,
          descuento: editForm.descuento,
          deposito: editForm.deposito,
          deposito_pagado: editForm.deposito_pagado,
          total: pedido.subtotal - editForm.descuento,
        })
        .eq('id', pedido.id);

      if (error) throw error;

      setPedido({
        ...pedido,
        ...editForm,
        total: pedido.subtotal - editForm.descuento,
      });
      
      setIsEditing(false);
      toast({
        title: "Pedido actualizado",
        description: "Los cambios se guardaron correctamente",
      });
    } catch (error) {
      console.error('Error updating pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el pedido",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    if (!pedido) {
      return { qrCode, success: false, message: "No hay pedido seleccionado" };
    }
    
    try {
      const { data, error } = await supabase.rpc('asignar_producto_por_qr', {
        p_qr_code: qrCode,
        p_pedido_id: pedido.id,
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        error?: string;
        message?: string;
        producto_nombre?: string;
        talla?: string;
        asignados?: number;
        solicitados?: number;
        completo?: boolean;
      };

      if (result.success) {
        fetchPedidoDetails();
        
        return {
          qrCode,
          success: true,
          message: result.message || "Asignado correctamente",
          productoNombre: result.producto_nombre,
          talla: result.talla,
          asignados: result.asignados,
          solicitados: result.solicitados,
        };
      } else {
        return {
          qrCode,
          success: false,
          message: result.error || "No se pudo asignar el vestido",
        };
      }
    } catch (error) {
      console.error('Error assigning product:', error);
      return {
        qrCode,
        success: false,
        message: "Error al procesar el código QR",
      };
    }
  };

  const handleUpdateStatus = async (newStatus: EstadoPedido) => {
    if (!pedido) return;
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: newStatus })
        .eq('id', pedido.id);

      if (error) throw error;

      setPedido({ ...pedido, estado: newStatus });
      toast({
        title: "Estado actualizado",
        description: `El pedido ahora está: ${getStatusLabel(newStatus)}`,
      });

      if (newStatus === 'entregado') {
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
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      alistado: 'Alistado',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendiente: 'bg-warning/10 text-warning border-warning/20',
      confirmado: 'bg-primary/10 text-primary border-primary/20',
      alistado: 'bg-primary/10 text-primary border-primary/20',
      enviado: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      entregado: 'bg-success/10 text-success border-success/20',
      cancelado: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status] || 'bg-muted';
  };

  const getItemStatus = (assigned: number, total: number) => {
    if (assigned === 0) return { text: 'Pendiente', color: 'bg-warning/10 text-warning border-warning/20' };
    if (assigned < total) return { text: 'Parcial', color: 'bg-primary/10 text-primary border-primary/20' };
    return { text: 'Completo', color: 'bg-success/10 text-success border-success/20' };
  };

  const totalAsignados = groupedItems.reduce((sum, g) => sum + g.cantidad_asignada, 0);
  const totalSolicitados = groupedItems.reduce((sum, g) => sum + g.cantidad_solicitada, 0);
  const todosAsignados = totalAsignados === totalSolicitados && totalSolicitados > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pedido) {
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

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pedido {pedido.numero_pedido}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado del Pedido</Label>
              <Select 
                value={editForm.estado} 
                onValueChange={(v) => setEditForm(prev => ({ ...prev, estado: v as EstadoPedido }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estadoOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Fecha del Evento</Label>
                <Input
                  type="date"
                  value={editForm.fecha_evento}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fecha_evento: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Entrega</Label>
                <Input
                  type="date"
                  value={editForm.fecha_entrega}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Devolución</Label>
                <Input
                  type="date"
                  value={editForm.fecha_devolucion}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fecha_devolucion: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección de Entrega</Label>
              <Textarea
                value={editForm.direccion_entrega}
                onChange={(e) => setEditForm(prev => ({ ...prev, direccion_entrega: e.target.value }))}
                placeholder="Dirección completa..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Distrito</Label>
                <Input
                  value={editForm.distrito_entrega}
                  onChange={(e) => setEditForm(prev => ({ ...prev, distrito_entrega: e.target.value }))}
                  placeholder="Distrito de entrega..."
                />
              </div>
              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input
                  value={editForm.referencia_entrega}
                  onChange={(e) => setEditForm(prev => ({ ...prev, referencia_entrega: e.target.value }))}
                  placeholder="Referencia de ubicación..."
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Descuento (S/)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.descuento}
                  onChange={(e) => setEditForm(prev => ({ ...prev, descuento: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Depósito (S/)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.deposito}
                  onChange={(e) => setEditForm(prev => ({ ...prev, deposito: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Depósito Pagado</Label>
                <Select 
                  value={editForm.deposito_pagado ? 'si' : 'no'} 
                  onValueChange={(v) => setEditForm(prev => ({ ...prev, deposito_pagado: v === 'si' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="si">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={editForm.notas}
                onChange={(e) => setEditForm(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => navigate("/pedidos")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Pedidos
          </Button>
          <h1 className="text-3xl font-bold">Pedido {pedido.numero_pedido}</h1>
          <p className="text-muted-foreground mt-1">
            Asignar vestidos y preparar para envío
          </p>
        </div>
        {canManageOrders && (
          <Button variant="outline" onClick={openEditDialog}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Pedido
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{pedido.cliente?.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{pedido.cliente?.telefono}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dirección de Entrega</p>
              <p className="font-medium">{pedido.direccion_entrega || pedido.cliente?.direccion}</p>
              {pedido.distrito_entrega && (
                <p className="text-sm text-muted-foreground">{pedido.distrito_entrega}</p>
              )}
            </div>
            {pedido.fecha_evento && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha del Evento</p>
                <p className="font-medium">{new Date(pedido.fecha_evento).toLocaleDateString('es-PE')}</p>
              </div>
            )}
            {pedido.notas && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="text-sm">{pedido.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={getStatusColor(pedido.estado)}>
                {getStatusLabel(pedido.estado)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {totalAsignados}/{totalSolicitados} vestidos asignados
              </span>
            </div>

            <div className="border rounded-lg p-3 space-y-1 bg-muted/50 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>S/ {pedido.subtotal?.toFixed(2)}</span>
              </div>
              {pedido.descuento > 0 && (
                <div className="flex justify-between">
                  <span>Descuento:</span>
                  <span>- S/ {pedido.descuento?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total:</span>
                <span>S/ {pedido.total?.toFixed(2)}</span>
              </div>
              {pedido.deposito > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Depósito {pedido.deposito_pagado ? '(Pagado)' : '(Pendiente)'}:</span>
                  <span>S/ {pedido.deposito?.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            {canManageOrders && (
              <div className="space-y-2">
                {!todosAsignados && (
                  <Button 
                    className="w-full" 
                    onClick={() => setIsScanning(true)}
                    disabled={processing}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Escanear QR para Asignar
                  </Button>
                )}
                
                {todosAsignados && pedido.estado !== 'alistado' && pedido.estado !== 'enviado' && pedido.estado !== 'entregado' && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpdateStatus('alistado')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Alistado
                  </Button>
                )}
                
                {pedido.estado === 'alistado' && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpdateStatus('enviado')}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Marcar como Enviado
                  </Button>
                )}

                {pedido.estado === 'enviado' && (
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    onClick={() => handleUpdateStatus('entregado')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Entregado
                  </Button>
                )}
                
                <Button className="w-full" variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            )}
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
            {canManageOrders && !todosAsignados && (
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
                  <TableHead>IMEI</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Solicitados</TableHead>
                  <TableHead>Asignados</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>QR Asignados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedItems.map((group, index) => {
                  const status = getItemStatus(group.cantidad_asignada, group.cantidad_solicitada);
                  return (
                    <TableRow key={`${group.variacion_id}-${index}`}>
                      <TableCell className="font-mono text-sm">
                        {group.producto_imei}
                      </TableCell>
                      <TableCell className="font-medium">
                        {group.producto_nombre}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{group.talla}</Badge>
                      </TableCell>
                      <TableCell>{group.cantidad_solicitada}</TableCell>
                      <TableCell>
                        <span className={group.cantidad_asignada === group.cantidad_solicitada ? 'text-success font-medium' : ''}>
                          {group.cantidad_asignada}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {group.qr_asignados.length > 0 ? (
                            group.qr_asignados.map((qr, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-mono">
                                {qr}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
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
