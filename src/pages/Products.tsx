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
import { Plus, Package, Loader2, QrCode, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface TipoTalla {
  id: string;
  nombre: string;
  valores: string[];
}

interface VariacionInput {
  tipoTallaId: string;
  talla: string;
  cantidad: number;
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
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductForm>(initialForm);
  const [variaciones, setVariaciones] = useState<VariacionInput[]>([]);
  const [selectedTipoTalla, setSelectedTipoTalla] = useState<string>("");

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
            stock_disponible,
            tipo_talla:tipo_tallas (nombre)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Create producto mutation
  const createProducto = useMutation({
    mutationFn: async () => {
      if (!formData.imei || !formData.nombre) {
        throw new Error("IMEI y nombre son requeridos");
      }
      if (variaciones.length === 0) {
        throw new Error("Debe agregar al menos una variación de talla");
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

      for (const variacion of variaciones) {
        const { data: variacionData, error: variacionError } = await supabase
          .from('variaciones_producto')
          .insert({
            producto_id: producto.id,
            tipo_talla_id: variacion.tipoTallaId,
            talla: variacion.talla,
            stock_disponible: variacion.cantidad,
            precio: variacion.precio,
          })
          .select()
          .single();

        if (variacionError) throw variacionError;

        const individuales = Array.from({ length: variacion.cantidad }, () => ({
          variacion_id: variacionData.id,
          estado: 'disponible' as const,
          qr_code: 'TEMP',
        }));

        const { error: individualesError } = await supabase
          .from('productos_individuales')
          .insert(individuales);

        if (individualesError) throw individualesError;
      }

      return producto;
    },
    onSuccess: (producto) => {
      toast({
        title: "Producto Creado",
        description: `${producto.nombre} con ${variaciones.reduce((acc, v) => acc + v.cantidad, 0)} unidades`,
      });
      closeDialog();
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

  const addVariacion = (talla: string) => {
    if (!selectedTipoTalla) return;
    
    const exists = variaciones.find(v => v.tipoTallaId === selectedTipoTalla && v.talla === talla);
    if (exists) {
      setVariaciones(variaciones.map(v => 
        v.tipoTallaId === selectedTipoTalla && v.talla === talla 
          ? { ...v, cantidad: v.cantidad + 1 }
          : v
      ));
    } else {
      setVariaciones([...variaciones, { tipoTallaId: selectedTipoTalla, talla, cantidad: 1, precio: 0 }]);
    }
  };

  const removeVariacion = (tipoTallaId: string, talla: string) => {
    setVariaciones(variaciones.filter(v => !(v.tipoTallaId === tipoTallaId && v.talla === talla)));
  };

  const updateCantidad = (tipoTallaId: string, talla: string, cantidad: number) => {
    if (cantidad < 1) return;
    setVariaciones(variaciones.map(v => 
      v.tipoTallaId === tipoTallaId && v.talla === talla ? { ...v, cantidad } : v
    ));
  };

  const updatePrecio = (tipoTallaId: string, talla: string, precio: number) => {
    setVariaciones(variaciones.map(v => 
      v.tipoTallaId === tipoTallaId && v.talla === talla ? { ...v, precio } : v
    ));
  };

  const selectedTipoTallaData = tipoTallas?.find(t => t.id === selectedTipoTalla);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProducto.mutate();
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este producto?")) {
      deleteProducto.mutate(id);
    }
  };

  const totalStock = productos?.reduce((sum, p) => 
    sum + (p.variaciones_producto?.reduce((s: number, v: any) => s + v.stock_disponible, 0) || 0), 0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
              <Label>Variaciones de Talla *</Label>
              
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
                      <div key={`${v.tipoTallaId}-${v.talla}`} className="flex items-center gap-2 bg-muted/50 p-2 rounded flex-wrap">
                        <Badge variant="secondary">{tipoNombre}</Badge>
                        <span className="font-medium">{v.talla}</span>
                        <span className="text-muted-foreground">×</span>
                        <Input
                          type="number"
                          min={1}
                          value={v.cantidad}
                          onChange={(e) => updateCantidad(v.tipoTallaId, v.talla, parseInt(e.target.value) || 1)}
                          className="w-16 h-8"
                        />
                        <span className="text-sm text-muted-foreground">uds</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-sm">S/</span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={v.precio}
                          onChange={(e) => updatePrecio(v.tipoTallaId, v.talla, parseFloat(e.target.value) || 0)}
                          className="w-20 h-8"
                          placeholder="Precio"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariacion(v.tipoTallaId, v.talla)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                  <p className="text-sm text-muted-foreground">
                    Total: {variaciones.reduce((acc, v) => acc + v.cantidad, 0)} unidades (QR automático)
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProducto.isPending || variaciones.length === 0}>
                {createProducto.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Producto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Productos</h1>
          <p className="text-muted-foreground mt-1">
            Crear y administrar productos del catálogo
          </p>
        </div>
        {canManageProducts && (
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productos?.reduce((sum, p) => sum + (p.variaciones_producto?.length || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <QrCode className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalStock}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Existentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProductos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : productos && productos.length > 0 ? (
            <div className="space-y-4">
              {productos.map((producto) => (
                <div key={producto.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{producto.imei}</Badge>
                        <h3 className="font-semibold">{producto.nombre}</h3>
                      </div>
                      {producto.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">{producto.descripcion}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {producto.variaciones_producto?.map((v: any) => (
                          <Badge key={v.id} variant="secondary" className="flex items-center gap-1">
                            <QrCode className="h-3 w-3" />
                            {v.talla} ({v.stock_disponible})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {canManageProducts && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(producto.id)}
                        disabled={deleteProducto.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay productos registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
