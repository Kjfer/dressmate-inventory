import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, Save, X, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  id: string;
  variacion_id: string;
  producto_nombre: string;
  talla: string;
  cantidad: number;
  precio_unitario: number;
  stock_disponible: number;
}

interface ClienteForm {
  nombre: string;
  telefono: string;
  direccion: string;
}

const CreateOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cliente, setCliente] = useState<ClienteForm>({
    nombre: "",
    telefono: "",
    direccion: ""
  });
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [searchTelefono, setSearchTelefono] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedVariacion, setSelectedVariacion] = useState<string>("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [fechaDevolucion, setFechaDevolucion] = useState("");
  const [notas, setNotas] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [deposito, setDeposito] = useState(0);

  // Fetch variaciones with product info
  const { data: variaciones } = useQuery({
    queryKey: ['variaciones-disponibles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variaciones_producto')
        .select(`
          id,
          talla,
          stock_disponible,
          precio,
          productos (id, imei, nombre)
        `)
        .gt('stock_disponible', 0)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Search client by phone
  const searchCliente = async () => {
    if (!searchTelefono.trim()) return;
    
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', searchTelefono.trim())
      .maybeSingle();
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    
    if (data) {
      setClienteId(data.id);
      setCliente({
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion
      });
      toast({ title: "Cliente encontrado", description: `${data.nombre}` });
    } else {
      setClienteId(null);
      setCliente(prev => ({ ...prev, telefono: searchTelefono }));
      toast({ title: "Cliente no encontrado", description: "Se creará un nuevo cliente" });
    }
  };

  // Create order mutation
  const createPedido = useMutation({
    mutationFn: async () => {
      // 1. Create or get cliente
      let finalClienteId = clienteId;
      
      if (!finalClienteId) {
        const { data: newCliente, error: clienteError } = await supabase
          .from('clientes')
          .insert({
            nombre: cliente.nombre.trim(),
            telefono: cliente.telefono.trim(),
            direccion: cliente.direccion.trim()
          })
          .select()
          .single();
        
        if (clienteError) throw clienteError;
        finalClienteId = newCliente.id;
      }

      // 2. Calculate totals
      const subtotal = orderItems.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
      const total = subtotal - descuento;

      // 3. Create pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: finalClienteId,
          fecha_evento: fechaEvento || null,
          fecha_entrega: fechaEntrega || null,
          fecha_devolucion: fechaDevolucion || null,
          subtotal,
          descuento,
          total,
          deposito,
          notas: notas || null,
          estado: 'pendiente'
        })
        .select()
        .single();
      
      if (pedidoError) throw pedidoError;

      // 4. Create detalle_pedido items
      const detalles = orderItems.map(item => ({
        pedido_id: pedido.id,
        variacion_id: item.variacion_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        notas: null
      }));

      const { error: detalleError } = await supabase
        .from('detalle_pedido')
        .insert(detalles);
      
      if (detalleError) throw detalleError;

      return pedido;
    },
    onSuccess: (pedido) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "Pedido Creado",
        description: `Pedido ${pedido.numero_pedido || pedido.id.slice(0, 8)} registrado exitosamente`,
      });
      navigate("/pedidos");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente.nombre || !cliente.telefono || !cliente.direccion) {
      toast({ title: "Error", description: "Complete la información del cliente", variant: "destructive" });
      return;
    }
    
    if (orderItems.length === 0) {
      toast({ title: "Error", description: "Agregue al menos un producto", variant: "destructive" });
      return;
    }

    createPedido.mutate();
  };

  const addItem = () => {
    if (!selectedVariacion) return;
    
    const variacion = variaciones?.find(v => v.id === selectedVariacion);
    if (!variacion) return;

    // Check if already added
    if (orderItems.some(item => item.variacion_id === selectedVariacion)) {
      toast({ title: "Aviso", description: "Este producto ya está en el pedido", variant: "destructive" });
      return;
    }

    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      variacion_id: variacion.id,
      producto_nombre: `${variacion.productos?.imei} - ${variacion.productos?.nombre}`,
      talla: variacion.talla,
      cantidad: 1,
      precio_unitario: (variacion as any).precio || 0,
      stock_disponible: variacion.stock_disponible
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedVariacion("");
  };

  const updateItem = (id: string, field: keyof OrderItem, value: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newValue = field === 'cantidad' 
          ? Math.min(Math.max(1, value), item.stock_disponible)
          : Math.max(0, value);
        return { ...item, [field]: newValue };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  const total = subtotal - descuento;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Crear Nuevo Pedido</h1>
          <p className="text-muted-foreground mt-1">
            Registrar información del cliente y productos
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/pedidos")}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente Section */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por teléfono..."
                value={searchTelefono}
                onChange={(e) => setSearchTelefono(e.target.value)}
                className="max-w-xs"
              />
              <Button type="button" variant="outline" onClick={searchCliente}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              {clienteId && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setClienteId(null);
                    setCliente({ nombre: "", telefono: "", direccion: "" });
                    setSearchTelefono("");
                  }}
                >
                  Limpiar
                </Button>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Cliente *</Label>
                <Input
                  id="nombre"
                  placeholder="Nombre completo"
                  value={cliente.nombre}
                  onChange={(e) => setCliente(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  placeholder="999-999-999"
                  value={cliente.telefono}
                  onChange={(e) => setCliente(prev => ({ ...prev, telefono: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Textarea
                id="direccion"
                placeholder="Dirección completa de entrega"
                value={cliente.direccion}
                onChange={(e) => setCliente(prev => ({ ...prev, direccion: e.target.value }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Fechas Section */}
        <Card>
          <CardHeader>
            <CardTitle>Fechas del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fechaEvento">Fecha del Evento</Label>
                <Input
                  id="fechaEvento"
                  type="date"
                  value={fechaEvento}
                  onChange={(e) => setFechaEvento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaEntrega">Fecha de Entrega</Label>
                <Input
                  id="fechaEntrega"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaDevolucion">Fecha de Devolución</Label>
                <Input
                  id="fechaDevolucion"
                  type="date"
                  value={fechaDevolucion}
                  onChange={(e) => setFechaDevolucion(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Productos del Pedido</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedVariacion} onValueChange={setSelectedVariacion}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar producto y talla..." />
                </SelectTrigger>
                <SelectContent>
                  {variaciones?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.productos?.imei} - {v.productos?.nombre} | Talla: {v.talla} | Stock: {v.stock_disponible}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={addItem} disabled={!selectedVariacion}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>

            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos agregados aún
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Talla</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.producto_nombre}</TableCell>
                      <TableCell>{item.talla}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          max={item.stock_disponible}
                          value={item.cantidad}
                          onChange={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precio_unitario}
                          onChange={(e) => updateItem(item.id, 'precio_unitario', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>S/ {(item.precio_unitario * item.cantidad).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Totals & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen y Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas del Pedido</Label>
                  <Textarea
                    id="notas"
                    placeholder="Observaciones adicionales..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="descuento">Descuento (S/)</Label>
                    <Input
                      id="descuento"
                      type="number"
                      min="0"
                      step="0.01"
                      value={descuento}
                      onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposito">Depósito (S/)</Label>
                    <Input
                      id="deposito"
                      type="number"
                      min="0"
                      step="0.01"
                      value={deposito}
                      onChange={(e) => setDeposito(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>S/ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Descuento:</span>
                    <span>- S/ {descuento.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/pedidos")}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={orderItems.length === 0 || createPedido.isPending}
          >
            {createPedido.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Confirmar Pedido
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
