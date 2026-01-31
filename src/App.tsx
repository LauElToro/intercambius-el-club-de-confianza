import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Ofertas from "./pages/Ofertas";
import Market from "./pages/Market";
import ProductoDetalle from "./pages/ProductoDetalle";
import Perfil from "./pages/Perfil";
import Coincidencias from "./pages/Coincidencias";
import CrearProducto from "./pages/CrearProducto";
import EditarProducto from "./pages/EditarProducto";
import MisPublicaciones from "./pages/MisPublicaciones";
import Historial from "./pages/Historial";
import Favoritos from "./pages/Favoritos";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/market" element={<Market />} />
              <Route path="/market/:id" element={<ProductoDetalle />} />
              <Route path="/producto/:id" element={<ProductoDetalle />} />
              <Route path="/perfil/:id" element={<Perfil />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/coincidencias" 
                element={
                  <ProtectedRoute>
                    <Coincidencias />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/crear-producto" 
                element={
                  <ProtectedRoute>
                    <CrearProducto />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/editar-producto/:id" 
                element={
                  <ProtectedRoute>
                    <EditarProducto />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mis-publicaciones" 
                element={
                  <ProtectedRoute>
                    <MisPublicaciones />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/historial" 
                element={
                  <ProtectedRoute>
                    <Historial />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/favoritos" 
                element={
                  <ProtectedRoute>
                    <Favoritos />
                  </ProtectedRoute>
                } 
              />
              <Route path="/ofertas" element={<Ofertas />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
