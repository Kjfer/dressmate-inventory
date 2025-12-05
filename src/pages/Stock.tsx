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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Plus, QrCode, Package, Loader2, ChevronDown, ChevronRight, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AddUnidadesForm {
  variacion_id: string;
  cantidad: number;
}

const Stock = () => {
  const { toast } = useToast();
  const { canManageProducts } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedVariacionId, setSelectedVariacionId] = useState<string | null>(null);
  const [form, setForm] = useState<AddUnidadesForm>({ variacion_id: "", cantidad: 1 });
  const [expandedVariaciones, setExpandedVariaciones] = useState<Set<string>>(new Set());

  // Fetch variaciones with producto info
  const { data: variaciones, isLoading } = useQuery({
    queryKey: ['variaciones-con-productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variaciones_producto')
        .select(`
          id,
          talla,
          precio,
          stock_disponible,
          producto:productos(id, imei, nombre),
          tipo_talla:tipo_tallas(nombre)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch productos individuales for selected variacion
  const { data: productosIndividuales, isLoading: loadingIndividuales } = useQuery({
    queryKey: ['productos-individuales', selectedVariacionId],
    queryFn: async () => {
      if (!selectedVariacionId) return [];
      const { data, error } = await supabase
        .from('productos_individuales')
        .select('*')
        .eq('variacion_id', selectedVariacionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedVariacionId
  });

  // Create productos individuales mutation
  const createIndividualesMutation = useMutation({
    mutationFn: async (data: AddUnidadesForm) => {
      // Create productos_individuales (QR se genera automáticamente por trigger)
      const individuales = Array.from({ length: data.cantidad }, () => ({
        variacion_id: data.variacion_id,
        qr_code: 'TEMP', // Will be overwritten by trigger
        estado: 'disponible' as const,
      }));

      const { error: indError } = await supabase
        .from('productos_individuales')
        .insert(individuales);
      
      if (indError) throw indError;

      // Recalculate stock
      const { count } = await supabase
        .from('productos_individuales')
        .select('*', { count: 'exact', head: true })
        .eq('variacion_id', data.variacion_id)
        .eq('estado', 'disponible');

      await supabase
        .from('variaciones_producto')
        .update({ stock_disponible: count || 0 })
        .eq('id', data.variacion_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variaciones-con-productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos-individuales'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast({ 
        title: "Unidades creadas", 
        description: `${form.cantidad} unidades físicas creadas con QR automático` 
      });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Delete producto individual
  const deleteIndividualMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: producto, error: fetchError } = await supabase
        .from('productos_individuales')
        .select('variacion_id, estado')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      if (producto.estado !== 'disponible') {
        throw new Error('Solo se pueden eliminar unidades disponibles');
      }

      const { error } = await supabase
        .from('productos_individuales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      // Recalculate stock
      const { count } = await supabase
        .from('productos_individuales')
        .select('*', { count: 'exact', head: true })
        .eq('variacion_id', producto.variacion_id)
        .eq('estado', 'disponible');

      await supabase
        .from('variaciones_producto')
        .update({ stock_disponible: count || 0 })
        .eq('id', producto.variacion_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variaciones-con-productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos-individuales'] });
      toast({ title: "Unidad eliminada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const openDialog = (variacionId?: string) => {
    setForm({ variacion_id: variacionId || "", cantidad: 1 });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setForm({ variacion_id: "", cantidad: 1 });
  };

  const openViewDialog = (variacionId: string) => {
    setSelectedVariacionId(variacionId);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.variacion_id || form.cantidad < 1) {
      toast({ title: "Error", description: "Seleccione una variación y cantidad válida", variant: "destructive" });
      return;
    }
    createIndividualesMutation.mutate(form);
  };

  const handleDeleteIndividual = (id: string) => {
    if (confirm("¿Está seguro de eliminar esta unidad?")) {
      deleteIndividualMutation.mutate(id);
    }
  };

  const toggleExpand = (variacionId: string) => {
    const newExpanded = new Set(expandedVariaciones);
    if (newExpanded.has(variacionId)) {
      newExpanded.delete(variacionId);
    } else {
      newExpanded.add(variacionId);
    }
    setExpandedVariaciones(newExpanded);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'bg-success/10 text-success border-success/20';
      case 'en_transito': return 'bg-warning/10 text-warning border-warning/20';
      case 'fuera_stock': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'Disponible';
      case 'en_transito': return 'En tránsito';
      case 'fuera_stock': return 'Fuera de stock';
      case 'devuelto': return 'Devuelto';
      default: return estado;
    }
  };

  const totalStock = variaciones?.reduce((sum, v) => sum + v.stock_disponible, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedVariacion = variaciones?.find(v => v.id === selectedVariacionId);

  return (
    <div className="space-y-6">
      {/* Add Units Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Unidades Físicas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Variación (Producto - Talla) *</Label>
              <Select 
                value={form.variacion_id} 
                onValueChange={(v) => setForm(prev => ({ ...prev, variacion_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar variación..." />
                </SelectTrigger>
                <SelectContent>
                  {variaciones?.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.producto?.imei} - {v.producto?.nombre} ({v.talla})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad de Unidades *</Label>
              <Input
                type="number"
                min="1"
                value={form.cantidad}
                onChange={(e) => setForm(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground">
                Se generará un código QR único para cada unidad
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createIndividualesMutation.isPending}>
                {createIndividualesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Unidades
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Individual Products Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Unidades Físicas - {selectedVariacion?.producto?.nombre} ({selectedVariacion?.talla})
            </DialogTitle>
          </DialogHeader>
          
          {loadingIndividuales ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : productosIndividuales && productosIndividuales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código QR</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entallado</TableHead>
                  <TableHead>Creado</TableHead>
                  {canManageProducts && <TableHead className="w-[60px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosIndividuales.map((pi) => (
                  <TableRow key={pi.id}>
                    <TableCell className="font-mono text-sm font-medium">{pi.qr_code}</TableCell>
                    <TableCell>
                      <Badge className={getEstadoColor(pi.estado)}>
                        {getEstadoLabel(pi.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>{pi.entallado ? 'Sí' : 'No'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(pi.created_at).toLocaleDateString()}
                    </TableCell>
                    {canManageProducts && (
                      <TableCell>
                        {pi.estado === 'disponible' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIndividual(pi.id)}
                            disabled={deleteIndividualMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay unidades físicas para esta variación
            </div>
          )}

          <DialogFooter>
            {canManageProducts && selectedVariacionId && (
              <Button onClick={() => { setIsViewDialogOpen(false); openDialog(selectedVariacionId); }}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Unidades
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Stock</h1>
          <p className="text-muted-foreground mt-1">
            Administrar unidades físicas y códigos QR
          </p>
        </div>
        {canManageProducts && (
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Unidades
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
            <CardTitle className="text-sm font-medium">Productos Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(variaciones?.map(v => v.producto?.id)).size}
            </div>
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
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variaciones.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-sm">{v.producto?.imei}</TableCell>
                    <TableCell className="font-medium">{v.producto?.nombre}</TableCell>
                    <TableCell>{v.tipo_talla?.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{v.talla}</Badge>
                    </TableCell>
                    <TableCell>S/ {(v.precio || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={v.stock_disponible > 0 ? "default" : "secondary"}>
                        {v.stock_disponible}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(v.id)}
                          title="Ver unidades"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageProducts && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog(v.id)}
                            title="Agregar unidades"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay variaciones registradas. Primero cree productos con variaciones.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;
