import { useState } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Cookie, Shield, Settings2 } from 'lucide-react';

export function CookieConsentBanner() {
  const { consent, acceptEssential, acceptPreferences, acceptAll } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);

  // No mostrar si ya eligió
  if (consent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="mx-auto max-w-2xl border-border shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Usamos cookies</CardTitle>
          </div>
          <CardDescription>
            Utilizamos cookies para mejorar tu experiencia, personalizar recomendaciones en Market y Coincidencias, y mejorar nuestra plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
              <p><strong>Esenciales:</strong> necesarias para el funcionamiento del sitio.</p>
              <p><strong>Preferencias:</strong> recordar búsquedas y gustos para ofrecerte coincidencias más relevantes.</p>
              <p><strong>Todas:</strong> incluye las anteriores más análisis para mejorar la plataforma.</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
              <Settings2 className="h-4 w-4 mr-1" />
              {showDetails ? 'Ocultar' : 'Más info'}
            </Button>
            <Button variant="ghost" size="sm" onClick={acceptEssential}>
              Solo esenciales
            </Button>
            <Button variant="secondary" size="sm" onClick={acceptPreferences}>
              <Shield className="h-4 w-4 mr-1" />
              Preferencias (recomendado)
            </Button>
            <Button size="sm" onClick={acceptAll} className="bg-gold hover:bg-gold/90">
              Aceptar todas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
