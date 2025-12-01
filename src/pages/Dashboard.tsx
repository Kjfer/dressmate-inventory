import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Truck, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Pedidos del Día",
      value: "12",
      icon: ShoppingCart,
      description: "3 pendientes de alistar",
      color: "text-primary",
    },
    {
      title: "Viajes Programados",
      value: "8",
      icon: Truck,
      description: "5 en camino",
      color: "text-warning",
    },
    {
      title: "Stock Total",
      value: "234",
      icon: Package,
      description: "Vestidos disponibles",
      color: "text-success",
    },
    {
      title: "Entregas Exitosas",
      value: "89%",
      icon: TrendingUp,
      description: "Este mes",
      color: "text-success",
    },
  ];

  const recentOrders = [
    {
      id: "PED-001",
      customer: "María González",
      items: 3,
      status: "Alistado",
      date: "2025-12-01",
    },
    {
      id: "PED-002",
      customer: "Ana Torres",
      items: 2,
      status: "Pendiente",
      date: "2025-12-01",
    },
    {
      id: "PED-003",
      customer: "Carmen Silva",
      items: 1,
      status: "Enviado",
      date: "2025-11-30",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Alistado":
        return "bg-success/10 text-success border-success/20";
      case "Pendiente":
        return "bg-warning/10 text-warning border-warning/20";
      case "Enviado":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen de operaciones del día
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {order.items} items
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Viajes de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: "VIA-001", motorizado: "Carlos Pérez", status: "En Camino" },
                { id: "VIA-002", motorizado: "Luis Martínez", status: "Programado" },
                { id: "VIA-003", motorizado: "Jorge Díaz", status: "Entregado" },
              ].map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{trip.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.motorizado}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      trip.status
                    )}`}
                  >
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
