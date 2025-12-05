import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Loader2, Trash2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Json } from "@/integrations/supabase/types";

interface TipoTalla {
  id: string;
  nombre: string;
  valores: string[];
}

interface VariacionInput {
  tipoTallaId: string;
  talla: string;
  precio: number;
}

interface ProductForm {
  imei: string;
  nombre: string;
  descripcion: string;
  imagen: string;
}

const initialForm: ProductForm = {
  imei: "",
  nombre: "",
  descripcion: "",
  imagen: "",
};

const Products = () => {
  const { toast } = useToast();
  const { canManageProducts } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVariacionDialogOpen, setIsVariacionDialogOpen] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductForm>(initialForm);
  const [variaciones, setVariaciones] = useState<VariacionInput[]>([]);
  const [selectedTipoTalla, setSelectedTipoTalla] = useState<string>("");
  const [newVariacion, setNewVariacion] = useState<VariacionInput>({ tipoTallaId: "", talla: "", precio: 0 });

  // Fetch tipo_tallas
  const { data: tipoTallas } = useQuery({
    queryKey: ['tipo_tallas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipo_tallas')
        .select('*');
      if (error) throw error;
      return data.map(tt => ({
        ...tt,
        valores: Array.isArray(tt.valores) ? (tt.valores as Json[]).map(v => String(v)) : []
      })) as TipoTalla[];
    }
  });

  // Fetch productos with variaciones
  const { data: productos, isLoading: loadingProductos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          variaciones_producto (
            id,
            talla,
            precio,
            stock_disponible,
            tipo_talla:tipo_tallas (nombre)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Create producto mutation (solo producto base)
  const createProducto = useMutation({
    mutationFn: async () => {
      if (!formData.imei || !formData.nombre) {
        throw new Error("IMEI y nombre son requeridos");
      }

      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .insert({
          imei: formData.imei.trim(),
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || null,
          imagen_url: formData.imagen.trim() || null,
        })
        .select()
        .single();

      if (productoError) throw productoError;

      // Crear variaciones si se agregaron
      for (const variacion of variaciones) {
        const { error: variacionError } = await supabase
          .from('variaciones_producto')
          .insert({
            producto_id: producto.id,
            tipo_talla_id: variacion.tipoTallaId,
            talla: variacion.talla,
            stock_disponible: 0,
            precio: variacion.precio,
          });

        if (variacionError) throw variacionError;
      }

      return producto;
    },
    onSuccess: (producto) => {
      toast({
        title: "Producto Creado",
        description: `${producto.nombre} creado. Ahora puede agregar unidades individuales desde Stock.`,
      });
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Add variacion to existing producto
  const addVariacionMutation = useMutation({
    mutationFn: async ({ productoId, variacion }: { productoId: string; variacion: VariacionInput }) => {
      const { error } = await supabase
        .from('variaciones_producto')
        .insert({
          producto_id: productoId,
          tipo_talla_id: variacion.tipoTallaId,
          talla: variacion.talla,
          stock_disponible: 0,
          precio: variacion.precio,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Variación agregada", description: "Ahora puede agregar unidades desde Stock" });
      setIsVariacionDialogOpen(false);
      setNewVariacion({ tipoTallaId: "", talla: "", precio: 0 });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteProducto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Producto eliminado" });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const openDialog = () => {
    setFormData(initialForm);
    setVariaciones([]);
    setSelectedTipoTalla("");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialForm);
    setVariaciones([]);
    setSelectedTipoTalla("");
  };

  const openVariacionDialog = (productoId: string) => {
    setSelectedProductoId(productoId);
    setNewVariacion({ tipoTallaId: "", talla: "", precio: 0 });
    setIsVariacionDialogOpen(true);
  };

  const addVariacion = (talla: string) => {
    if (!selectedTipoTalla) return;
    
    const exists = variaciones.find(v => v.tipoTallaId === selectedTipoTalla && v.talla === talla);
    if (!exists) {
      setVariaciones([...variaciones, { tipoTallaId: selectedTipoTalla, talla, precio: 0 }]);
    }
  };

  const removeVariacion = (tipoTallaId: string, talla: string) => {
    setVariaciones(variaciones.filter(v => !(v.tipoTallaId === tipoTallaId && v.talla === talla)));
  };

  const updatePrecio = (tipoTallaId: string, talla: string, precio: number) => {
    setVariaciones(variaciones.map(v => 
      v.tipoTallaId === tipoTallaId && v.talla === talla ? { ...v, precio } : v
    ));
  };

  const selectedTipoTallaData = tipoTallas?.find(t => t.id === selectedTipoTalla);
  const newTipoTallaData = tipoTallas?.find(t => t.id === newVariacion.tipoTallaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProducto.mutate();
  };

  const handleAddVariacion = () => {
    if (!selectedProductoId || !newVariacion.tipoTallaId || !newVariacion.talla) return;
    addVariacionMutation.mutate({ productoId: selectedProductoId, variacion: newVariacion });
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este producto y todas sus variaciones?")) {
      deleteProducto.mutate(id);
    }
  };

  const totalVariaciones = productos?.reduce((sum, p) => sum + (p.variaciones_producto?.length || 0), 0) || 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Create Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>IMEI / Código *</Label>
                <Input
                  placeholder="Ej: VES-001"
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre del Producto *</Label>
                <Input
                  placeholder="Ej: Vestido Elegante Azul"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción detallada..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>URL de Imagen</Label>
              <Input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={formData.imagen}
                onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
              />
            </div>

            {/* Variaciones */}
            <div className="space-y-3 border-t pt-4">
              <Label>Variaciones de Talla (Opcional)</Label>
              <p className="text-sm text-muted-foreground">
                Puede agregar variaciones ahora o después
              </p>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tipo de Talla</Label>
                <Select value={selectedTipoTalla} onValueChange={setSelectedTipoTalla}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoTallas?.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id}>{tipo.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTipoTallaData && (
                <div className="flex flex-wrap gap-2">
                  {selectedTipoTallaData.valores.map(talla => (
                    <Button
                      key={talla}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addVariacion(talla)}
                      className="h-9"
                    >
                      + {talla}
                    </Button>
                  ))}
                </div>
              )}

              {variaciones.length > 0 && (
                <div className="space-y-2 mt-3">
                  {variaciones.map((v) => {
                    const tipoNombre = tipoTallas?.find(t => t.id === v.tipoTallaId)?.nombre || '';
                    return (
                      <div key={`${v.tipoTallaId}-${v.talla}`} className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg flex-wrap">
                        <Badge variant="secondary" className="shrink-0">{tipoNombre}</Badge>
                        <span className="font-medium">{v.talla}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-sm text-muted-foreground">S/</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={v.precio}
                            onChange={(e) => updatePrecio(v.tipoTallaId, v.talla, parseFloat(e.target.value) || 0)}
                            className="w-24 h-9"
                            placeholder="Precio"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVariacion(v.tipoTallaId, v.talla)}
                            className="h-9 w-9 shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={createProducto.isPending} className="w-full sm:w-auto">
                {createProducto.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Producto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Variacion to Existing Product Dialog */}
      <Dialog open={isVariacionDialogOpen} onOpenChange={setIsVariacionDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Variación de Talla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Talla *</Label>
              <Select 
                value={newVariacion.tipoTallaId} 
                onValueChange={(v) => setNewVariacion({ ...newVariacion, tipoTallaId: v, talla: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipoTallas?.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>{tipo.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newTipoTallaData && (
              <div className="space-y-2">
                <Label>Talla *</Label>
                <Select 
                  value={newVariacion.talla} 
                  onValueChange={(v) => setNewVariacion({ ...newVariacion, talla: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar talla" />
                  </SelectTrigger>
                  <SelectContent>
                    {newTipoTallaData.valores.map(talla => (
                      <SelectItem key={talla} value={talla}>{talla}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Precio de Alquiler (S/)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={newVariacion.precio}
                onChange={(e) => setNewVariacion({ ...newVariacion, precio: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsVariacionDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              onClick={handleAddVariacion} 
              disabled={!newVariacion.tipoTallaId || !newVariacion.talla || addVariacionMutation.isPending}
              className="w-full sm:w-auto"
            >
              {addVariacionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Agregar Variación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona productos y variaciones
          </p>
        </div>
        {canManageProducts && (
          <Button onClick={openDialog} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">{productos?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Variaciones</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">{totalVariaciones}</div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-5 w-5" />
            Catálogo
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {loadingProductos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : productos && productos.length > 0 ? (
            <div className="space-y-3">
              {productos.map((producto) => (
                <div 
                  key={producto.id} 
                  className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {producto.imei}
                        </Badge>
                        <h3 className="font-semibold text-sm sm:text-base truncate">
                          {producto.nombre}
                        </h3>
                      </div>
                      {producto.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {producto.descripcion}
                        </p>
                      )}
                      
                      {/* Variaciones */}
                      <div className="mt-3">
                        {producto.variaciones_producto && producto.variaciones_producto.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {producto.variaciones_producto.map((v: any) => (
                              <Badge 
                                key={v.id} 
                                variant="secondary" 
                                className="text-xs py-1 px-2"
                              >
                                {v.talla} · S/{v.precio?.toFixed(2)} 
                                <span className="opacity-60 ml-1">({v.stock_disponible})</span>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Sin variaciones</p>
                        )}
                      </div>
                    </div>
                    
                    {canManageProducts && (
                      <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVariacionDialog(producto.id)}
                          className="h-9 px-3"
                        >
                          <Plus className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Variación</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(producto.id)}
                          disabled={deleteProducto.isPending}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay productos registrados</p>
              {canManageProducts && (
                <Button onClick={openDialog} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer producto
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
