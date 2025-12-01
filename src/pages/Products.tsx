import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Products = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    imei: "",
    nombre: "",
    descripcion: "",
    imagen: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Producto Creado",
      description: `IMEI: ${formData.imei} - ${formData.nombre}`,
    });
    setFormData({ imei: "", nombre: "", descripcion: "", imagen: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Productos</h1>
        <p className="text-muted-foreground mt-1">
          Crear y administrar productos del catálogo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Nuevo Producto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imei">IMEI *</Label>
                <Input
                  id="imei"
                  placeholder="Ej: VES-2025-001"
                  value={formData.imei}
                  onChange={(e) =>
                    setFormData({ ...formData, imei: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Producto *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Vestido Elegante Azul"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Descripción detallada del producto..."
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen">URL de Imagen</Label>
              <Input
                id="imagen"
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={formData.imagen}
                onChange={(e) =>
                  setFormData({ ...formData, imagen: e.target.value })
                }
              />
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Crear Producto
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Existentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay productos registrados aún
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
