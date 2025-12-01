import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
import Orders from "./pages/Orders";
import CreateOrder from "./pages/CreateOrder";
import OrderDetail from "./pages/OrderDetail";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import Motorized from "./pages/Motorized";
import Search from "./pages/Search";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/productos"
            element={
              <Layout>
                <Products />
              </Layout>
            }
          />
          <Route
            path="/productos/stock"
            element={
              <Layout>
                <Stock />
              </Layout>
            }
          />
          <Route
            path="/pedidos"
            element={
              <Layout>
                <Orders />
              </Layout>
            }
          />
          <Route
            path="/pedidos/nuevo"
            element={
              <Layout>
                <CreateOrder />
              </Layout>
            }
          />
          <Route
            path="/pedidos/:id"
            element={
              <Layout>
                <OrderDetail />
              </Layout>
            }
          />
          <Route
            path="/viajes"
            element={
              <Layout>
                <Trips />
              </Layout>
            }
          />
          <Route
            path="/viajes/:id"
            element={
              <Layout>
                <TripDetail />
              </Layout>
            }
          />
          <Route
            path="/motorizados"
            element={
              <Layout>
                <Motorized />
              </Layout>
            }
          />
          <Route
            path="/buscar"
            element={
              <Layout>
                <Search />
              </Layout>
            }
          />
          <Route path="/install" element={<Install />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
