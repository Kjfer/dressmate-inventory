import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X, Loader2, Search, ShoppingCart, User, Calendar, Package } from "lucide-react";
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

      const subtotal = orderItems.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
      const total = subtotal - descuento;

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
    if (!selectedVariacion) {
      toast({ title: "Seleccione un producto", variant: "destructive" });
      return;
    }
    
    const variacion = variaciones?.find(v => v.id === selectedVariacion);
    if (!variacion) return;

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
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nuevo Pedido</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registrar cliente y productos
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/pedidos")} className="w-full sm:w-auto">
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Cliente Section */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Buscar por teléfono..."
                value={searchTelefono}
                onChange={(e) => setSearchTelefono(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={searchCliente} className="flex-1 sm:flex-none">
                  <Search className="h-4 w-4 sm:mr-2" />
                  <span className="sm:inline">Buscar</span>
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
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
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
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fechas Section */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-5 w-5" />
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fechaEvento">Evento</Label>
                <Input
                  id="fechaEvento"
                  type="date"
                  value={fechaEvento}
                  onChange={(e) => setFechaEvento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaEntrega">Entrega</Label>
                <Input
                  id="fechaEntrega"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaDevolucion">Devolución</Label>
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
          <CardHeader className="px-4 sm:px-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-5 w-5" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            {/* Product selector */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedVariacion} onValueChange={setSelectedVariacion}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent className="max-h-[50vh]">
                  {variaciones?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="block truncate">
                        {v.productos?.imei} - {v.productos?.nombre} | {v.talla} | Stock: {v.stock_disponible}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addItem} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>

            {/* Items list */}
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No hay productos agregados</p>
                <p className="text-sm">Seleccione un producto arriba</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="border rounded-lg p-4 bg-card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.producto_nombre}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Talla: {item.talla}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          max={item.stock_disponible}
                          value={item.cantidad}
                          onChange={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Precio</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precio_unitario}
                          onChange={(e) => updateItem(item.id, 'precio_unitario', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Subtotal</Label>
                        <div className="h-9 flex items-center font-medium">
                          S/ {(item.precio_unitario * item.cantidad).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals & Notes */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pb-4">
            <CardTitle className="text-base sm:text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    placeholder="Observaciones adicionales..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
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
                
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>S/ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span className="text-destructive">- S/ {descuento.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">S/ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-muted-foreground">Depósito</span>
                    <span className="text-success">S/ {deposito.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo pendiente</span>
                    <span>S/ {(total - deposito).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button - Fixed on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:relative md:p-0 md:border-t-0 md:bg-transparent">
          <Button 
            type="submit" 
            disabled={createPedido.isPending || orderItems.length === 0} 
            className="w-full md:w-auto"
            size="lg"
          >
            {createPedido.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Pedido
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
