import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { FileDown, TrendingUp, Package, CheckCircle } from "lucide-react";

const motorizedList = [
  { id: "1", nombre: "Carlos Pérez" },
  { id: "2", nombre: "Luis Martínez" },
  { id: "3", nombre: "Jorge Díaz" },
];

const mockReport = {
  motorizado: "Carlos Pérez",
  periodo: "Diciembre 2025",
  datos: [
    { fecha: "2025-12-01", viajes: 5, entregas: 4, devoluciones: 1 },
    { fecha: "2025-11-30", viajes: 4, entregas: 4, devoluciones: 0 },
    { fecha: "2025-11-29", viajes: 6, entregas: 5, devoluciones: 1 },
    { fecha: "2025-11-28", viajes: 3, entregas: 3, devoluciones: 0 },
    { fecha: "2025-11-27", viajes: 5, entregas: 5, devoluciones: 0 },
  ],
  totales: {
    viajesRealizados: 23,
    entregasExitosas: 21,
    devoluciones: 2,
    tasaExito: 91,
  },
};

const Motorized = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reporte de Motorizados</h1>
          <p className="text-muted-foreground mt-1">
            Métricas y desempeño de entregas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Seleccionar Motorizado</CardTitle>
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Select defaultValue="1">
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Seleccione motorizado" />
            </SelectTrigger>
            <SelectContent>
              {motorizedList.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Viajes
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockReport.totales.viajesRealizados}
            </div>
            <p className="text-xs text-muted-foreground">
              En el periodo seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entregas Exitosas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {mockReport.totales.entregasExitosas}
            </div>
            <p className="text-xs text-muted-foreground">
              Completadas correctamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devoluciones</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {mockReport.totales.devoluciones}
            </div>
            <p className="text-xs text-muted-foreground">
              Productos devueltos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {mockReport.totales.tasaExito}%
            </div>
            <p className="text-xs text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Viajes Realizados</TableHead>
                <TableHead>Entregas Exitosas</TableHead>
                <TableHead>Devoluciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReport.datos.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.fecha}</TableCell>
                  <TableCell>{row.viajes}</TableCell>
                  <TableCell className="text-success">{row.entregas}</TableCell>
                  <TableCell className="text-warning">
                    {row.devoluciones}
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

export default Motorized;
