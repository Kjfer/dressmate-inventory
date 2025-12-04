import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Plus, QrCode, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StockForm {
  producto_id: string;
  tipo_talla_id: string;
  talla: string;
  cantidad: number;
}

const initialForm: StockForm = {
  producto_id: "",
  tipo_talla_id: "",
  talla: "",
  cantidad: 1,
};

const Stock = () => {
  const { toast } = useToast();
  const { canManageProducts } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<StockForm>(initialForm);

  // Fetch productos
  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('id, imei, nombre')
        .order('imei');
      if (error) throw error;
      return data;
    }
  });

  // Fetch tipo_tallas
  const { data: tipoTallas } = useQuery({
    queryKey: ['tipo-tallas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipo_tallas')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  // Fetch variaciones with stock
  const { data: variaciones, isLoading } = useQuery({
    queryKey: ['variaciones-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variaciones_producto')
        .select(`
          id,
          talla,
          stock_disponible,
          producto:productos(id, imei, nombre),
          tipo_talla:tipo_tallas(nombre)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Get selected tipo_talla values
  const selectedTipoTalla = tipoTallas?.find(t => t.id === form.tipo_talla_id);
  const tallasDisponibles = selectedTipoTalla?.valores as string[] || [];

  const createMutation = useMutation({
    mutationFn: async (data: StockForm) => {
      // 1. Check or create variacion
      let variacionId: string;
      
      const { data: existingVar } = await supabase
        .from('variaciones_producto')
        .select('id')
        .eq('producto_id', data.producto_id)
        .eq('talla', data.talla)
        .maybeSingle();
      
      if (existingVar) {
        variacionId = existingVar.id;
      } else {
        const { data: newVar, error: varError } = await supabase
          .from('variaciones_producto')
          .insert({
            producto_id: data.producto_id,
            tipo_talla_id: data.tipo_talla_id,
            talla: data.talla,
            stock_disponible: 0,
          })
          .select()
          .single();
        
        if (varError) throw varError;
        variacionId = newVar.id;
      }

      // 2. Create productos_individuales
      const individuales = Array.from({ length: data.cantidad }, () => ({
        variacion_id: variacionId,
        qr_code: 'TEMP', // Will be overwritten by trigger
        estado: 'disponible' as const,
      }));

      const { error: indError } = await supabase
        .from('productos_individuales')
        .insert(individuales);
      
      if (indError) throw indError;

      // 3. Update stock count
      const { error: stockError } = await supabase
        .from('variaciones_producto')
        .update({ 
          stock_disponible: (existingVar ? 0 : 0) + data.cantidad 
        })
        .eq('id', variacionId);
      
      // Actually let's recalculate stock properly
      const { count } = await supabase
        .from('productos_individuales')
        .select('*', { count: 'exact', head: true })
        .eq('variacion_id', variacionId)
        .eq('estado', 'disponible');

      await supabase
        .from('variaciones_producto')
        .update({ stock_disponible: count || 0 })
        .eq('id', variacionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variaciones-stock'] });
      queryClient.invalidateQueries({ queryKey: ['variaciones-disponibles'] });
      toast({ 
        title: "Stock generado", 
        description: `${form.cantidad} unidades creadas con QR automático` 
      });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const openDialog = () => {
    setForm(initialForm);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setForm(initialForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.producto_id || !form.tipo_talla_id || !form.talla || form.cantidad < 1) {
      toast({ title: "Error", description: "Complete todos los campos", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const totalStock = variaciones?.reduce((sum, v) => sum + v.stock_disponible, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Stock Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Stock por Talla</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Producto *</Label>
              <Select 
                value={form.producto_id} 
                onValueChange={(v) => setForm(prev => ({ ...prev, producto_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {productos?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.imei} - {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Talla *</Label>
              <Select 
                value={form.tipo_talla_id} 
                onValueChange={(v) => setForm(prev => ({ ...prev, tipo_talla_id: v, talla: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {tipoTallas?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.tipo_talla_id && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Talla *</Label>
                  <Select 
                    value={form.talla} 
                    onValueChange={(v) => setForm(prev => ({ ...prev, talla: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tallasDisponibles.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.cantidad}
                    onChange={(e) => setForm(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generar Stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Stock</h1>
          <p className="text-muted-foreground mt-1">
            Administrar variaciones y unidades individuales
          </p>
        </div>
        {canManageProducts && (
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Generar Stock
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variaciones</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{variaciones?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disponible</CardTitle>
            <QrCode className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock por Variación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variaciones && variaciones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo Talla</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Stock Disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variaciones.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-sm">{v.producto?.imei}</TableCell>
                    <TableCell className="font-medium">{v.producto?.nombre}</TableCell>
                    <TableCell>{v.tipo_talla?.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{v.talla}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.stock_disponible > 0 ? "default" : "secondary"}>
                        {v.stock_disponible}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay variaciones registradas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;
