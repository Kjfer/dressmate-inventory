import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Eye, Loader2, Truck, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type TipoViaje = 'entrega_inicial' | 'cambio_producto' | 'entallado';
type EstadoViaje = 'programado' | 'en_camino' | 'entregado' | 'con_devolucion';

interface ViajeForm {
  pedido_id: string;
  motorizado_id: string;
  tipo_viaje: TipoViaje;
  fecha_envio: string;
  observaciones: string;
}

const initialForm: ViajeForm = {
  pedido_id: "",
  motorizado_id: "",
  tipo_viaje: "entrega_inicial",
  fecha_envio: new Date().toISOString().split('T')[0],
  observaciones: "",
};

const tipoViajeLabels: Record<TipoViaje, string> = {
  entrega_inicial: "Entrega Inicial",
  cambio_producto: "Cambio de Producto",
  entallado: "Entallado",
};

const estadoViajeLabels: Record<EstadoViaje, string> = {
  programado: "Programado",
  en_camino: "En Camino",
  entregado: "Entregado",
  con_devolucion: "Con Devolución",
};

const Trips = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canManageOrders } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ViajeForm>(initialForm);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch viajes
  const { data: viajes, isLoading } = useQuery({
    queryKey: ['viajes', filterDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viajes')
        .select(`
          *,
          pedido:pedidos(
            numero_pedido,
            cliente:clientes(nombre, direccion, telefono)
          ),
          motorizado:motorizados(nombre, telefono)
        `)
        .gte('fecha_envio', filterDate)
        .lte('fecha_envio', filterDate)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch pedidos alistados for selection
  const { data: pedidosAlistados } = useQuery({
    queryKey: ['pedidos-alistados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          numero_pedido,
          cliente:clientes(nombre)
        `)
        .in('estado', ['alistado', 'confirmado'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch motorizados activos
  const { data: motorizados } = useQuery({
    queryKey: ['motorizados-activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motorizados')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: ViajeForm) => {
      const { error } = await supabase.from('viajes').insert({
        pedido_id: data.pedido_id,
        motorizado_id: data.motorizado_id || null,
        tipo_viaje: data.tipo_viaje,
        fecha_envio: data.fecha_envio,
        observaciones: data.observaciones.trim() || null,
        estado: 'programado',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viajes'] });
      toast({ title: "Viaje creado", description: "Se programó correctamente" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const openCreateDialog = () => {
    setForm({ ...initialForm, fecha_envio: filterDate });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setForm(initialForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pedido_id || !form.fecha_envio) {
      toast({ title: "Error", description: "Seleccione un pedido y fecha", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      programado: "bg-muted text-muted-foreground",
      en_camino: "bg-primary/10 text-primary border-primary/20",
      entregado: "bg-success/10 text-success border-success/20",
      con_devolucion: "bg-warning/10 text-warning border-warning/20",
    };
    return colors[status] || "bg-muted";
  };

  const getTripTypeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      entrega_inicial: "bg-primary/10 text-primary border-primary/20",
      cambio_producto: "bg-warning/10 text-warning border-warning/20",
      entallado: "bg-info/10 text-info border-info/20",
    };
    return colors[tipo] || "bg-muted";
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
      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar Nuevo Viaje</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pedido *</Label>
              <Select 
                value={form.pedido_id} 
                onValueChange={(v) => setForm(prev => ({ ...prev, pedido_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar pedido..." />
                </SelectTrigger>
                <SelectContent>
                  {pedidosAlistados?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.numero_pedido} - {p.cliente?.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motorizado</Label>
              <Select 
                value={form.motorizado_id} 
                onValueChange={(v) => setForm(prev => ({ ...prev, motorizado_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Asignar motorizado (opcional)..." />
                </SelectTrigger>
                <SelectContent>
                  {motorizados?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Viaje *</Label>
                <Select 
                  value={form.tipo_viaje} 
                  onValueChange={(v) => setForm(prev => ({ ...prev, tipo_viaje: v as TipoViaje }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrega_inicial">Entrega Inicial</SelectItem>
                    <SelectItem value="cambio_producto">Cambio de Producto</SelectItem>
                    <SelectItem value="entallado">Entallado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Envío *</Label>
                <Input
                  type="date"
                  value={form.fecha_envio}
                  onChange={(e) => setForm(prev => ({ ...prev, fecha_envio: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={form.observaciones}
                onChange={(e) => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Notas adicionales..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Programar Viaje
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Viajes</h1>
          <p className="text-muted-foreground mt-1">
            Programar y seguir entregas diarias
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto"
            />
          </div>
          {canManageOrders && (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Viaje
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total del Día</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viajes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viajes?.filter(v => v.estado === 'programado').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Camino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {viajes?.filter(v => v.estado === 'en_camino').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {viajes?.filter(v => v.estado === 'entregado').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Viajes del {new Date(filterDate + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {viajes && viajes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Viaje</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motorizado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viajes.map((viaje) => (
                  <TableRow key={viaje.id}>
                    <TableCell className="font-medium">
                      {viaje.numero_viaje || viaje.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{viaje.pedido?.numero_pedido}</TableCell>
                    <TableCell>{viaje.pedido?.cliente?.nombre}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {viaje.pedido?.cliente?.direccion}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTripTypeColor(viaje.tipo_viaje)}>
                        {tipoViajeLabels[viaje.tipo_viaje as TipoViaje]}
                      </Badge>
                    </TableCell>
                    <TableCell>{viaje.motorizado?.nombre || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(viaje.estado)}>
                        {estadoViajeLabels[viaje.estado as EstadoViaje]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/viajes/${viaje.id}`)}
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
              No hay viajes programados para esta fecha
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Trips;
