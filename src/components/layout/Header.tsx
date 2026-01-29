import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-intercambius.jpeg";

const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Intercambius" className="h-10 w-10 rounded-full" />
          <span className="text-xl font-semibold gold-text">Intercambius</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/ofertas" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Ofertas
          </Link>
          <Link 
            to="/coincidencias" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Coincidencias
          </Link>
          <Link 
            to="/dashboard" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Mi cuenta
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isHome ? (
            <>
              <Link to="/registro">
                <Button variant="gold" size="default">
                  Sumarme
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/dashboard">
              <Button variant="gold-outline" size="default">
                Mi cuenta
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
