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
import { Badge } from "@/components/ui/badge";
import { Plus, QrCode, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const sizeTypes = {
  letras: ["S", "M", "L", "XL"],
  numeros_ninos: ["2", "4", "6", "8", "10", "12"],
  numeros_adultos: ["36", "38", "40", "42", "44", "46"],
};

const mockProducts = [
  { imei: "VES-2025-001", nombre: "Vestido Elegante Azul" },
  { imei: "VES-2025-002", nombre: "Vestido Cocktail Negro" },
  { imei: "VES-2025-003", nombre: "Vestido Casual Rosa" },
];

const mockStock = [
  {
    id: "1",
    imei: "VES-2025-001",
    talla: "M",
    stock: 5,
    entallados: 1,
  },
  {
    id: "2",
    imei: "VES-2025-001",
    talla: "L",
    stock: 3,
    entallados: 0,
  },
  {
    id: "3",
    imei: "VES-2025-002",
    talla: "S",
    stock: 4,
    entallados: 0,
  },
];

const Stock = () => {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [sizeType, setSizeType] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleGenerateStock = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Stock Generado",
      description: `${quantity} unidades de talla ${selectedSize} para ${selectedProduct}`,
    });
    setQuantity("");
    setSelectedSize("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Stock por Tallas</h1>
        <p className="text-muted-foreground mt-1">
          Administrar variaciones y stock de productos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generar Stock por Talla
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateStock} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product">Seleccionar Producto *</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((product) => (
                      <SelectItem key={product.imei} value={product.imei}>
                        {product.imei} - {product.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sizeType">Tipo de Talla *</Label>
                <Select
                  value={sizeType}
                  onValueChange={(value) => {
                    setSizeType(value);
                    setSelectedSize("");
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letras">Letras (S, M, L, XL)</SelectItem>
                    <SelectItem value="numeros_ninos">
                      Números Niños (2-12)
                    </SelectItem>
                    <SelectItem value="numeros_adultos">
                      Números Adultos (36-46)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sizeType && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="size">Talla *</Label>
                  <Select
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione talla" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeTypes[sizeType as keyof typeof sizeTypes].map(
                        (size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad a Generar *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="Ej: 5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={!sizeType}>
              <Plus className="h-4 w-4 mr-2" />
              Generar Stock
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IMEI</TableHead>
                <TableHead>Talla</TableHead>
                <TableHead>Stock Disponible</TableHead>
                <TableHead>Entallados</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.imei}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.talla}</Badge>
                  </TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>
                    {item.entallados > 0 ? (
                      <Badge variant="secondary">{item.entallados}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;
