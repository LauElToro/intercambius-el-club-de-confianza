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
  LogOut,
  FileText,
  Receipt,
  Heart,
  MessageCircle,
  ShoppingCart
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CurrencySwitch } from "@/components/ui/currency-switch";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { HeaderSaldo } from "@/components/layout/HeaderSaldo";
import { IX_PESOS_PER_USD } from "@/lib/currency";
import logo from "@/assets/logo-intercambius.jpeg";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { variant, setVariant } = useCurrencyVariant();
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });
  const usuario = currentUser || user;
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
    { to: "/favoritos", label: "Favoritos", icon: Heart },
    { to: "/chat", label: "Mensajes", icon: MessageCircle },
    { to: "/mis-publicaciones", label: "Mis publicaciones", icon: FileText },
    { to: "/mis-compras", label: "Mis compras", icon: ShoppingCart },
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
        {/* Logo: siempre lleva a la landing */}
        <Link to="/" className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <img 
            src={logo} 
            alt="Intercambius" 
            className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover"
          />
          <span className="text-base sm:text-lg md:text-xl font-semibold gold-text truncate max-w-[140px] sm:max-w-none">
            Intercambius
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {user && (
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === "/dashboard"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Home className="h-4 w-4" />
              Inicio
            </Link>
          )}
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
        </nav>

        {/* Right side: saldo IOX + equivalente ARS/USD + switch */}
        <div className="flex items-center gap-2 md:gap-3">
          {usuario && <HeaderSaldo saldo={usuario.saldo ?? 0} />}
          <div className="hidden md:block">
            <CurrencySwitch />
          </div>
          {/* Notificaciones (solo si está logueado) */}
          {!!user && <NotificationDropdown />}
          {/* Theme Toggle - oculto en mobile (está en el sheet) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden md:flex h-9 w-9"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="default" className="hidden sm:flex gap-2">
                      <Avatar className="h-8 w-8">
                        {(usuario as any)?.fotoPerfil && (
                          <AvatarImage src={(usuario as any).fotoPerfil} alt={usuario?.nombre} />
                        )}
                        <AvatarFallback className="bg-gold/20 text-gold text-sm">
                          {usuario?.nombre?.slice(0, 2).toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[120px] truncate">{usuario?.nombre ?? "Cuenta"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        <User className="h-4 w-4 mr-2" />
                        Cuenta - Saldo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/perfil/${user?.id}`}>
                        <User className="h-4 w-4 mr-2" />
                        Mi perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {navItems.filter(item => item.to !== "/market").map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
                      return (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link
                            to={item.to}
                            className={cn(isActive && "bg-muted")}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => { logout(); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

          {/* Mobile Menu Button - touch target mínimo 44px */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-11 w-11 min-h-[44px] min-w-[44px] -mr-1"
                aria-label="Abrir menú"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(85vw,360px)] sm:w-[400px] p-0 flex flex-col max-h-[100dvh]">
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

                {/* Navigation Items - touch targets min 44px */}
                <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                    Principal
                  </p>
                  <div className="space-y-1">
                    {/* Inicio: landing si no logueado, dashboard si logueado */}
                    <button
                      onClick={() => handleNavClick(user ? "/dashboard" : "/")}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-colors min-h-[48px] touch-manipulation",
                        (user ? location.pathname === "/dashboard" : location.pathname === "/")
                          ? "bg-gold/10 text-gold border border-gold/20"
                          : "text-foreground hover:bg-muted active:bg-muted/80"
                      )}
                    >
                      <Home className="h-5 w-5 shrink-0" />
                      <span className="font-medium">Inicio</span>
                    </button>

                    <button
                      onClick={() => handleNavClick("/market")}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-colors min-h-[48px] touch-manipulation",
                        location.pathname.startsWith("/market")
                          ? "bg-gold/10 text-gold border border-gold/20"
                          : "text-foreground hover:bg-muted active:bg-muted/80"
                      )}
                    >
                      <ShoppingBag className="h-5 w-5 shrink-0" />
                      <span className="font-medium">Market</span>
                    </button>
                  </div>

                  {(() => {
                    const token = localStorage.getItem("intercambius_token");
                    if (!token) return null;
                    
                    return (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mt-6 mb-2">
                          Mi cuenta
                        </p>
                        <div className="space-y-1">
                          {navItems.filter(item => item.to !== "/market").map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.to || 
                              (item.to !== "/" && location.pathname.startsWith(item.to));
                            
                            return (
                              <button
                                key={item.to}
                                onClick={() => handleNavClick(item.to)}
                                className={cn(
                                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-colors min-h-[48px] touch-manipulation",
                                  isActive
                                    ? "bg-gold/10 text-gold border border-gold/20"
                                    : "text-foreground hover:bg-muted active:bg-muted/80"
                                )}
                              >
                                <Icon className="h-5 w-5 shrink-0" />
                                <span className="font-medium">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}

                  <Separator className="my-4" />

                  {/* CTA en mobile */}
                  {(() => {
                    const token = localStorage.getItem("intercambius_token");
                    const isAuthenticated = !!token;

                    if (isAuthenticated) {
                      return (
                        <div className="space-y-2">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start gap-4 h-12 px-4 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                            onClick={() => { logout(); setMobileMenuOpen(false); }}
                          >
                            <LogOut className="h-5 w-5 shrink-0" />
                            <span className="font-medium">Cerrar sesión</span>
                          </Button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleNavClick("/login")}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border hover:bg-muted min-h-[48px] touch-manipulation"
                          >
                            <LogIn className="h-5 w-5 shrink-0" />
                            <span className="font-medium">Iniciar sesión</span>
                          </button>
                          <button
                            onClick={() => handleNavClick("/registro")}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gold hover:bg-gold/90 text-primary-foreground min-h-[48px] touch-manipulation font-medium"
                          >
                            <User className="h-5 w-5 shrink-0" />
                            <span>Sumarme</span>
                          </button>
                        </div>
                      );
                    }
                  })()}
                </nav>

                {/* Footer: saldo, moneda, tema */}
                <div className="shrink-0 px-4 py-4 border-t bg-muted/30 space-y-3">
                  {usuario && (
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground mb-1">Tu saldo</p>
                      <p className="text-xl font-bold gold-text">
                        {(usuario.saldo ?? 0).toLocaleString("es-AR")} IOX
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${(usuario.saldo ?? 0).toLocaleString("es-AR")} ARS · {(Number(usuario.saldo ?? 0) / IX_PESOS_PER_USD).toFixed(2)} USD
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
                      <span className="text-sm font-medium">Moneda</span>
                      <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setVariant('IOX-ARS')}
                          className={`flex-1 min-h-[44px] px-3 text-xs font-medium rounded-md transition-colors touch-manipulation active:scale-[0.98] ${
                            variant === 'IOX-ARS' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          IOX-ARS
                        </button>
                        <button
                          type="button"
                          onClick={() => setVariant('IOX-USD')}
                          className={`flex-1 min-h-[44px] px-3 text-xs font-medium rounded-md transition-colors touch-manipulation active:scale-[0.98] ${
                            variant === 'IOX-USD' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          IOX-USD
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium min-h-[48px] touch-manipulation"
                    >
                      <span>Tema</span>
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </button>
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
