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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, QrCode, Package, Loader2, Eye, Trash2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QRPrintModal } from "@/components/QRPrintModal";

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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedVariacionId, setSelectedVariacionId] = useState<string | null>(null);
  const [form, setForm] = useState<AddUnidadesForm>({ variacion_id: "", cantidad: 1 });

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
  const { data: productosIndividuales, isLoading: loadingIndividuales, refetch: refetchIndividuales } = useQuery({
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
      const individuales = Array.from({ length: data.cantidad }, () => ({
        variacion_id: data.variacion_id,
        qr_code: 'TEMP',
        estado: 'disponible' as const,
      }));

      const { error: indError } = await supabase
        .from('productos_individuales')
        .insert(individuales);
      
      if (indError) throw indError;

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

  const openPrintModal = async (variacionId: string) => {
    setSelectedVariacionId(variacionId);
    // Wait a tick for state to update then refetch
    setTimeout(() => {
      refetchIndividuales();
    }, 0);
    setIsPrintModalOpen(true);
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
  const selectedVariacion = variaciones?.find(v => v.id === selectedVariacionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Add Units Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
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
                <SelectContent className="max-h-[50vh]">
                  {variaciones?.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="block truncate">
                        {v.producto?.imei} - {v.producto?.nombre} ({v.talla})
                      </span>
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

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={createIndividualesMutation.isPending} className="w-full sm:w-auto">
                {createIndividualesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Unidades
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Individual Products Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <QrCode className="h-5 w-5" />
              <span className="truncate">
                {selectedVariacion?.producto?.nombre} ({selectedVariacion?.talla})
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingIndividuales ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : productosIndividuales && productosIndividuales.length > 0 ? (
              <div className="space-y-2 pr-1">
                {productosIndividuales.map((pi) => (
                  <div 
                    key={pi.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium truncate">{pi.qr_code}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={`${getEstadoColor(pi.estado)} text-xs`}>
                          {getEstadoLabel(pi.estado)}
                        </Badge>
                        {pi.entallado && (
                          <Badge variant="outline" className="text-xs">Entallado</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(pi.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {canManageProducts && pi.estado === 'disponible' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteIndividual(pi.id)}
                        disabled={deleteIndividualMutation.isPending}
                        className="shrink-0 ml-2"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No hay unidades físicas</p>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 pt-4 border-t flex-col sm:flex-row gap-2">
            {productosIndividuales && productosIndividuales.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => { setIsViewDialogOpen(false); openPrintModal(selectedVariacionId!); }}
                className="w-full sm:w-auto"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir QRs
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">
              Cerrar
            </Button>
            {canManageProducts && selectedVariacionId && (
              <Button 
                onClick={() => { setIsViewDialogOpen(false); openDialog(selectedVariacionId); }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Unidades
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Print Modal */}
      {selectedVariacion && productosIndividuales && (
        <QRPrintModal
          open={isPrintModalOpen}
          onOpenChange={setIsPrintModalOpen}
          productos={productosIndividuales}
          variacionInfo={{
            producto_nombre: selectedVariacion.producto?.nombre || '',
            talla: selectedVariacion.talla
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Stock</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unidades físicas y códigos QR
          </p>
        </div>
        {canManageProducts && (
          <Button onClick={() => openDialog()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Unidades
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Variaciones</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">{variaciones?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Disponible</CardTitle>
            <QrCode className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-success">{totalStock}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Productos Base</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">
              {new Set(variaciones?.map(v => v.producto?.id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variaciones List */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-5 w-5" />
            Stock por Variación
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {variaciones && variaciones.length > 0 ? (
            <div className="space-y-3">
              {variaciones.map((v: any) => (
                <div 
                  key={v.id} 
                  className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {v.producto?.imei}
                        </Badge>
                        <span className="font-medium text-sm sm:text-base truncate">
                          {v.producto?.nombre}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {v.tipo_talla?.nombre}: {v.talla}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          S/ {(v.precio || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0">
                      <Badge 
                        variant={v.stock_disponible > 0 ? "default" : "secondary"}
                        className="text-sm px-3 py-1"
                      >
                        {v.stock_disponible} uds
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(v.id)}
                          className="h-9"
                          title="Ver unidades"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {v.stock_disponible > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPrintModal(v.id)}
                            className="h-9"
                            title="Imprimir QRs"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                        {canManageProducts && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openDialog(v.id)}
                            className="h-9"
                            title="Agregar unidades"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay variaciones registradas</p>
              <p className="text-sm mt-1">Crea productos y variaciones primero</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;
