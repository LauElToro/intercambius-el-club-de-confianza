import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Moon, 
  Sun, 
  Menu, 
  X, 
  ShoppingBag, 
  Users, 
  User,
  Home,
  LogIn,
  FileText,
  Receipt
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-intercambius.jpeg";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar menú mobile al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: "/market", label: "Market", icon: ShoppingBag },
    { to: "/coincidencias", label: "Coincidencias", icon: Users },
    { to: "/mis-publicaciones", label: "Mis publicaciones", icon: FileText },
    { to: "/historial", label: "Historial", icon: Receipt }
  ];

  const handleNavClick = (to: string) => {
    navigate(to);
    setMobileMenuOpen(false);
  };

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <img src={logo} alt="Intercambius" className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
            <span className="text-lg md:text-xl font-semibold gold-text">Intercambius</span>
          </Link>
          <div className="h-9 w-9" />
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <img 
            src={logo} 
            alt="Intercambius" 
            className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover"
          />
          <span className="text-lg md:text-xl font-semibold gold-text hidden sm:inline-block">
            Intercambius
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Market siempre visible */}
          <Link
            to="/market"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname.startsWith("/market")
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            Market
          </Link>
          
          {/* Items protegidos solo si está autenticado */}
          {(() => {
            const token = localStorage.getItem("intercambius_token");
            if (!token) return null;
            
            return navItems.filter(item => item.to !== "/market").map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || 
                (item.to !== "/" && location.pathname.startsWith(item.to));
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            });
          })()}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Desktop CTA Button */}
          {!isMobile && (() => {
            const token = localStorage.getItem("intercambius_token");
            const isAuthenticated = !!token;

            if (isAuthenticated) {
              return (
                <Link to="/dashboard">
                  <Button variant="gold-outline" size="default" className="hidden sm:flex">
                    Mi cuenta
                  </Button>
                </Link>
              );
            } else {
              return isHome ? (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="default" className="hidden sm:flex">
                      Iniciar sesión
                    </Button>
                  </Link>
                  <Link to="/registro">
                    <Button variant="gold" size="default" className="hidden sm:flex">
                      Sumarme
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="gold" size="default" className="hidden sm:flex">
                    Iniciar sesión
                  </Button>
                </Link>
              );
            }
          })()}

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0">
              <div className="flex flex-col h-full">
                {/* Header del menú mobile */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src={logo} 
                      alt="Intercambius" 
                      className="h-10 w-10 rounded-full"
                    />
                    <SheetTitle className="text-xl font-semibold gold-text">
                      Intercambius
                    </SheetTitle>
                  </div>
                </SheetHeader>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                  {/* Home link */}
                  <button
                    onClick={() => handleNavClick("/")}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      location.pathname === "/"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Inicio</span>
                  </button>

                  {/* Market link (público) */}
                  <button
                    onClick={() => handleNavClick("/market")}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      location.pathname.startsWith("/market")
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="font-medium">Market</span>
                  </button>

                  {(() => {
                    const token = localStorage.getItem("intercambius_token");
                    if (!token) return null;
                    
                    return (
                      <>
                        <Separator className="my-2" />
                        {/* Main nav items (solo si está autenticado) */}
                        {navItems.filter(item => item.to !== "/market").map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.to || 
                            (item.to !== "/" && location.pathname.startsWith(item.to));
                          
                          return (
                            <button
                              key={item.to}
                              onClick={() => handleNavClick(item.to)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                                isActive
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="font-medium">{item.label}</span>
                            </button>
                          );
                        })}
                      </>
                    );
                  })()}

                  <Separator className="my-2" />

                  {/* CTA Button en mobile */}
                  {(() => {
                    const token = localStorage.getItem("intercambius_token");
                    const isAuthenticated = !!token;

                    if (isAuthenticated) {
                      return (
                        <Link to="/dashboard" className="block">
                          <Button 
                            variant="gold-outline" 
                            className="w-full justify-start gap-3 h-auto py-3"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-5 w-5" />
                            <span className="font-medium">Mi cuenta</span>
                          </Button>
                        </Link>
                      );
                    } else {
                      return (
                        <>
                          <Link to="/login" className="block mb-2">
                            <Button 
                              variant="outline" 
                              className="w-full justify-start gap-3 h-auto py-3"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <LogIn className="h-5 w-5" />
                              <span className="font-medium">Iniciar sesión</span>
                            </Button>
                          </Link>
                          <Link to="/registro" className="block">
                            <Button 
                              variant="gold" 
                              className="w-full justify-start gap-3 h-auto py-3"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <LogIn className="h-5 w-5" />
                              <span className="font-medium">Sumarme</span>
                            </Button>
                          </Link>
                        </>
                      );
                    }
                  })()}
                </nav>

                {/* Footer del menú mobile */}
                <div className="px-4 py-4 border-t">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Tema</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="h-8 gap-2"
                    >
                      {theme === "dark" ? (
                        <>
                          <Sun className="h-4 w-4" />
                          <span>Claro</span>
                        </>
                      ) : (
                        <>
                          <Moon className="h-4 w-4" />
                          <span>Oscuro</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
