import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, CheckCircle, Share } from "lucide-react";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Smartphone className="h-6 w-6 text-primary" />
            Instalar Aplicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">¡App Instalada!</h2>
              <p className="text-muted-foreground">
                La aplicación ya está instalada en tu dispositivo.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-lg">
                  Instala esta aplicación en tu teléfono para acceder rápidamente
                  y trabajar sin conexión.
                </p>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted">
                    <Download className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Rápido</h3>
                    <p className="text-sm text-muted-foreground">
                      Acceso directo desde tu pantalla de inicio
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted">
                    <Smartphone className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Sin Conexión</h3>
                    <p className="text-sm text-muted-foreground">
                      Funciona incluso sin internet
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Cámara QR</h3>
                    <p className="text-sm text-muted-foreground">
                      Escanea códigos QR directamente
                    </p>
                  </div>
                </div>
              </div>

              {isInstallable ? (
                <Button
                  onClick={handleInstall}
                  size="lg"
                  className="w-full text-lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Instalar Ahora
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Share className="h-4 w-4" />
                      Instalación Manual
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">En iPhone (Safari):</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Toca el botón de Compartir</li>
                        <li>Selecciona "Añadir a pantalla de inicio"</li>
                        <li>Toca "Añadir"</li>
                      </ol>

                      <p className="font-medium mt-4">En Android (Chrome):</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Toca el menú (⋮) en la esquina superior</li>
                        <li>Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"</li>
                        <li>Toca "Instalar"</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="w-full"
            >
              Ir a la Aplicación
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
