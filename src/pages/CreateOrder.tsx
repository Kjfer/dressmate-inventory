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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CreateOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Pedido Creado",
      description: "El pedido ha sido registrado exitosamente",
    });
    navigate("/pedidos");
  };

  const addItem = () => {
    setOrderItems([
      ...orderItems,
      { id: Date.now(), imei: "", talla: "", cantidad: 1 },
    ]);
  };

  const removeItem = (id: number) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

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
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Cliente *</Label>
                <Input
                  id="nombre"
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  placeholder="555-0000"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Textarea
                id="direccion"
                placeholder="Dirección completa de entrega"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Productos del Pedido</CardTitle>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos agregados aún
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Talla</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          placeholder="VES-2025-001"
                          className="w-full"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="M"
                          className="w-24"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="w-20"
                          required
                        />
                      </TableCell>
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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/pedidos")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={orderItems.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Confirmar Pedido
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
