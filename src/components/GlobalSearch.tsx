import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Package,
  ShoppingCart,
  User,
  Search,
  FileText,
} from "lucide-react";

// Mock data - En producción esto vendría de la base de datos
const mockProducts = [
  { id: "1", imei: "VES-2025-001", nombre: "Vestido Elegante Azul" },
  { id: "2", imei: "VES-2025-002", nombre: "Vestido Cocktail Negro" },
  { id: "3", imei: "VES-2025-003", nombre: "Vestido Casual Rosa" },
  { id: "4", imei: "VES-2025-004", nombre: "Vestido Fiesta Rojo" },
  { id: "5", imei: "VES-2025-005", nombre: "Vestido Noche Dorado" },
];

const mockOrders = [
  { id: "PED-001", cliente: "María González", estado: "Alistado" },
  { id: "PED-002", cliente: "Ana Torres", estado: "Pendiente" },
  { id: "PED-003", cliente: "Carmen Silva", estado: "Enviado" },
  { id: "PED-004", cliente: "Laura Méndez", estado: "Entregado" },
  { id: "PED-005", cliente: "Rosa Jiménez", estado: "Confirmado" },
];

const mockClients = [
  { id: "1", nombre: "María González", telefono: "555-0101" },
  { id: "2", nombre: "Ana Torres", telefono: "555-0102" },
  { id: "3", nombre: "Carmen Silva", telefono: "555-0103" },
  { id: "4", nombre: "Laura Méndez", telefono: "555-0104" },
  { id: "5", nombre: "Rosa Jiménez", telefono: "555-0105" },
];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

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

  const hasResults =
    filteredProducts.length > 0 ||
    filteredOrders.length > 0 ||
    filteredClients.length > 0;

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar pedidos, productos, clientes..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!query && (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Escribe para buscar pedidos, productos o clientes
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Usa{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">
                  Ctrl+K
                </kbd>{" "}
                para abrir esta búsqueda desde cualquier lugar
              </p>
            </div>
          </CommandEmpty>
        )}

        {query && !hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No se encontraron resultados para "{query}"
              </p>
            </div>
          </CommandEmpty>
        )}

        {filteredOrders.length > 0 && (
          <>
            <CommandGroup heading="Pedidos">
              {filteredOrders.slice(0, 5).map((order) => (
                <CommandItem
                  key={order.id}
                  onSelect={() =>
                    handleSelect(() => navigate(`/pedidos/${order.id}`))
                  }
                  className="cursor-pointer"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{order.id}</span>
                    <span className="text-xs text-muted-foreground">
                      Cliente: {order.cliente} • Estado: {order.estado}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {filteredProducts.length > 0 && (
          <>
            <CommandGroup heading="Productos">
              {filteredProducts.slice(0, 5).map((product) => (
                <CommandItem
                  key={product.id}
                  onSelect={() =>
                    handleSelect(() => navigate("/productos/stock"))
                  }
                  className="cursor-pointer"
                >
                  <Package className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{product.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      IMEI: {product.imei}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {filteredClients.length > 0 && (
          <CommandGroup heading="Clientes">
            {filteredClients.slice(0, 5).map((client) => (
              <CommandItem
                key={client.id}
                onSelect={() => handleSelect(() => navigate("/pedidos"))}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{client.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    Tel: {client.telefono}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
