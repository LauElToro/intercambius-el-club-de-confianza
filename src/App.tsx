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
import Coincidencias from "./pages/Coincidencias";
import RegistrarIntercambio from "./pages/RegistrarIntercambio";
import CrearProducto from "./pages/CrearProducto";
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
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/market" element={<Market />} />
            <Route path="/market/:id" element={<ProductoDetalle />} />
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
              path="/registrar-intercambio" 
              element={
                <ProtectedRoute>
                  <RegistrarIntercambio />
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
            <Route path="/ofertas" element={<Ofertas />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
