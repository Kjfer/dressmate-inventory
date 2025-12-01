import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Package, ShoppingCart, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data
const mockProducts = [
  { id: "1", imei: "VES-2025-001", nombre: "Vestido Elegante Azul", stock: 15 },
  { id: "2", imei: "VES-2025-002", nombre: "Vestido Cocktail Negro", stock: 8 },
  { id: "3", imei: "VES-2025-003", nombre: "Vestido Casual Rosa", stock: 12 },
  { id: "4", imei: "VES-2025-004", nombre: "Vestido Fiesta Rojo", stock: 6 },
  { id: "5", imei: "VES-2025-005", nombre: "Vestido Noche Dorado", stock: 10 },
];

const mockOrders = [
  {
    id: "PED-001",
    cliente: "María González",
    items: 3,
    estado: "Alistado",
    fecha: "2025-12-01",
  },
  {
    id: "PED-002",
    cliente: "Ana Torres",
    items: 2,
    estado: "Pendiente",
    fecha: "2025-12-01",
  },
  {
    id: "PED-003",
    cliente: "Carmen Silva",
    items: 1,
    estado: "Enviado",
    fecha: "2025-11-30",
  },
  {
    id: "PED-004",
    cliente: "Laura Méndez",
    items: 4,
    estado: "Entregado",
    fecha: "2025-11-29",
  },
  {
    id: "PED-005",
    cliente: "Rosa Jiménez",
    items: 2,
    estado: "Confirmado",
    fecha: "2025-11-28",
  },
];

const mockClients = [
  {
    id: "1",
    nombre: "María González",
    telefono: "555-0101",
    direccion: "Calle Principal 123",
    pedidos: 5,
  },
  {
    id: "2",
    nombre: "Ana Torres",
    telefono: "555-0102",
    direccion: "Avenida Central 456",
    pedidos: 3,
  },
  {
    id: "3",
    nombre: "Carmen Silva",
    telefono: "555-0103",
    direccion: "Calle Norte 789",
    pedidos: 8,
  },
  {
    id: "4",
    nombre: "Laura Méndez",
    telefono: "555-0104",
    direccion: "Boulevard Sur 321",
    pedidos: 2,
  },
  {
    id: "5",
    nombre: "Rosa Jiménez",
    telefono: "555-0105",
    direccion: "Plaza Mayor 654",
    pedidos: 6,
  },
];

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.nombre.toLowerCase().includes(query.toLowerCase()) ||
      product.imei.toLowerCase().includes(query.toLowerCase())
  );

  const filteredOrders = mockOrders.filter(
    (order) =>
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.cliente.toLowerCase().includes(query.toLowerCase())
  );

  const filteredClients = mockClients.filter(
    (client) =>
      client.nombre.toLowerCase().includes(query.toLowerCase()) ||
      client.telefono.includes(query)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Alistado":
        return "bg-success/10 text-success border-success/20";
      case "Pendiente":
        return "bg-warning/10 text-warning border-warning/20";
      case "Enviado":
        return "bg-primary/10 text-primary border-primary/20";
      case "Entregado":
        return "bg-muted text-muted-foreground";
      case "Confirmado":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Búsqueda Global</h1>
        <p className="text-muted-foreground mt-1">
          Encuentra pedidos, productos y clientes rápidamente
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, IMEI, ID de pedido, teléfono..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              autoFocus
            />
          </div>
        </CardHeader>
      </Card>

      {query && (
        <div className="text-sm text-muted-foreground">
          Mostrando resultados para: <span className="font-medium">"{query}"</span>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({filteredProducts.length + filteredOrders.length + filteredClients.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Pedidos ({filteredOrders.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-1" />
            Productos ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="clients">
            <User className="h-4 w-4 mr-1" />
            Clientes ({filteredClients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Pedidos ({filteredOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/pedidos/${order.id}`)}
                      >
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.cliente}</TableCell>
                        <TableCell>{order.items}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(order.estado)}
                          >
                            {order.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.fecha}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {filteredProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate("/productos/stock")}
                      >
                        <TableCell className="font-medium">
                          {product.imei}
                        </TableCell>
                        <TableCell>{product.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.stock}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {filteredClients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Clientes ({filteredClients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Pedidos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate("/pedidos")}
                      >
                        <TableCell className="font-medium">
                          {client.nombre}
                        </TableCell>
                        <TableCell>{client.telefono}</TableCell>
                        <TableCell>{client.direccion}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.pedidos}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {query &&
            filteredProducts.length === 0 &&
            filteredOrders.length === 0 &&
            filteredClients.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No se encontraron resultados
                  </h3>
                  <p className="text-muted-foreground">
                    Intenta con otros términos de búsqueda
                  </p>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="orders">
          {filteredOrders.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/pedidos/${order.id}`)}
                      >
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.cliente}</TableCell>
                        <TableCell>{order.items}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(order.estado)}
                          >
                            {order.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.fecha}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No se encontraron pedidos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products">
          {filteredProducts.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate("/productos/stock")}
                      >
                        <TableCell className="font-medium">
                          {product.imei}
                        </TableCell>
                        <TableCell>{product.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.stock}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No se encontraron productos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clients">
          {filteredClients.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Pedidos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate("/pedidos")}
                      >
                        <TableCell className="font-medium">
                          {client.nombre}
                        </TableCell>
                        <TableCell>{client.telefono}</TableCell>
                        <TableCell>{client.direccion}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.pedidos}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No se encontraron clientes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Search;
