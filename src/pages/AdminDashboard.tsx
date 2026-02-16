import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  adminService,
  AdminMetrics,
  AdminApiError,
} from "@/services/admin.service";
import {
  exportMetricsToExcel,
  exportUsersToExcel,
  exportProductosToExcel,
  exportIntercambiosToExcel,
} from "@/lib/exportExcel";
import {
  Users,
  Package,
  ShoppingCart,
  Coins,
  MessageCircle,
  LogOut,
  Loader2,
  Mail,
  BarChart3,
  Sun,
  Moon,
  Download,
  Ban,
  ShieldOff,
  Trash2,
} from "lucide-react";

type Tab = "metricas" | "usuarios" | "productos" | "intercambios" | "newsletter";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("metricas");
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<{ data: any[]; total: number; page: number; totalPages: number } | null>(null);
  const [productos, setProductos] = useState<{ data: any[]; total: number; page: number; totalPages: number } | null>(null);
  const [intercambios, setIntercambios] = useState<{ data: any[]; total: number; page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newsletter, setNewsletter] = useState({ subject: "", bodyHtml: "", enviarATodos: true });
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<string | null>(null);
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  }), []);

  useEffect(() => {
    if (!adminService.isLoggedIn()) {
      navigate("/admin", { replace: true });
      return;
    }
    loadMetrics();
  }, [navigate]);

  const loadMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminService.getMetrics();
      setMetrics(data);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 401) {
        adminService.logout();
        navigate("/admin", { replace: true });
        return;
      }
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page = 1) => {
    try {
      const data = await adminService.getUsers(page, 15);
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadProductos = async (page = 1) => {
    try {
      const data = await adminService.getProductos(page, 15);
      setProductos(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadIntercambios = async (page = 1) => {
    try {
      const data = await adminService.getIntercambios(page, 15);
      setIntercambios(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (tab === "usuarios" && !users) loadUsers();
    if (tab === "productos" && !productos) loadProductos();
    if (tab === "intercambios" && !intercambios) loadIntercambios();
  }, [tab]);

  const handleLogout = () => {
    adminService.logout();
    navigate("/admin", { replace: true });
  };

  const handleBan = async (userId: number) => {
    setUserActionLoading(userId);
    const page = users?.page || 1;
    try {
      await adminService.banUser(userId);
      setUsers(null);
      loadUsers(page);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleUnban = async (userId: number) => {
    setUserActionLoading(userId);
    const page = users?.page || 1;
    try {
      await adminService.unbanUser(userId);
      setUsers(null);
      loadUsers(page);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setUserActionLoading(userId);
    const page = users?.page || 1;
    try {
      await adminService.deleteUser(userId);
      setDeleteUserId(null);
      setUsers(null);
      loadUsers(page);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleExport = async (type: "metricas" | "usuarios" | "productos" | "intercambios") => {
    setExporting(type);
    try {
      if (type === "metricas" && metrics) {
        exportMetricsToExcel(metrics);
      } else if (type === "usuarios") {
        const res = await adminService.getUsersForExport();
        exportUsersToExcel(res.data);
      } else if (type === "productos") {
        const res = await adminService.getProductosForExport();
        exportProductosToExcel(res.data);
      } else if (type === "intercambios") {
        const res = await adminService.getIntercambiosForExport();
        exportIntercambiosToExcel(res.data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(null);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bodyText = (newsletter.bodyHtml || "").replace(/<[^>]*>/g, "").trim();
    if (!newsletter.subject.trim() || !bodyText) return;
    setNewsletterSending(true);
    setNewsletterResult(null);
    try {
      const result = await adminService.sendNewsletter({
        subject: newsletter.subject,
        bodyHtml: newsletter.bodyHtml,
        bodyText: newsletter.bodyHtml.replace(/<[^>]*>/g, "\n"),
        enviarATodos: newsletter.enviarATodos,
      });
      setNewsletterResult(`Enviados ${result.enviados} de ${result.total}. ${result.errores?.length ? `Errores: ${result.errores.length}` : ""}`);
    } catch (err) {
      setNewsletterResult((err as Error).message);
    } finally {
      setNewsletterSending(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "metricas", label: "Métricas", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "usuarios", label: "Usuarios", icon: <Users className="w-4 h-4" /> },
    { id: "productos", label: "Productos", icon: <Package className="w-4 h-4" /> },
    { id: "intercambios", label: "Transacciones", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "newsletter", label: "Newsletter", icon: <Mail className="w-4 h-4" /> },
  ];

  if (loading && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold gold-text">Panel Admin — Intercambius</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <nav className="border-b bg-card px-4 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "secondary" : "ghost"}
            size="sm"
            className="rounded-b-none"
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span className="ml-2 hidden sm:inline">{t.label}</span>
          </Button>
        ))}
      </nav>

      <main className="container max-w-6xl mx-auto p-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {tab === "metricas" && metrics && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => handleExport("metricas")} disabled={!!exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting === "metricas" ? "..." : "Descargar Excel"}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{metrics.usuarios.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Productos publicados</CardTitle>
                  <Package className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{metrics.productos.total}</p>
                  <p className="text-xs text-muted-foreground">{metrics.productos.activos} activos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventas / Compras</CardTitle>
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{metrics.ventasCompras.transaccionesTotal}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Conversaciones</CardTitle>
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{metrics.contacto.conversacionesTotal}</p>
                  <p className="text-xs text-muted-foreground">{metrics.contacto.mensajesTotal} mensajes</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Token (IX)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo en circulación</p>
                    <p className="text-xl font-semibold">{metrics.token.saldoEnCirculacion.toLocaleString()} IX</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Volumen transacciones</p>
                    <p className="text-xl font-semibold">{metrics.token.volumenTransacciones.toLocaleString()} IX</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gastado (compras)</p>
                    <p className="text-xl font-semibold">{metrics.token.tokenGastadoCompras.toLocaleString()} IX</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recibido (ventas)</p>
                    <p className="text-xl font-semibold">{metrics.token.tokenRecibidoVentas.toLocaleString()} IX</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "usuarios" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuarios</CardTitle>
                <p className="text-sm text-muted-foreground">Listado de usuarios registrados</p>
              </div>
              {users && (
                <Button variant="outline" size="sm" onClick={() => handleExport("usuarios")} disabled={!!exporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {exporting === "usuarios" ? "..." : "Excel"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!users ? (
                <Button variant="outline" onClick={() => loadUsers()}>
                  Cargar usuarios
                </Button>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Intercambios</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.data.map((u: any) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.id}</TableCell>
                          <TableCell>{u.nombre}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            {u.bannedAt ? (
                              <span className="text-destructive font-medium">Baneado</span>
                            ) : (
                              <span className="text-muted-foreground">Activo</span>
                            )}
                          </TableCell>
                          <TableCell>{u.saldo} IX</TableCell>
                          <TableCell>{u.productosPublicados}</TableCell>
                          <TableCell>{u.intercambios}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {u.bannedAt ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Desbanear"
                                  disabled={userActionLoading === u.id}
                                  onClick={() => handleUnban(u.id)}
                                >
                                  <ShieldOff className="w-4 h-4 text-green-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Banear"
                                  disabled={userActionLoading === u.id}
                                  onClick={() => handleBan(u.id)}
                                >
                                  <Ban className="w-4 h-4 text-amber-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Eliminar"
                                disabled={userActionLoading === u.id}
                                onClick={() => setDeleteUserId(u.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <AlertDialog open={deleteUserId != null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario (productos, intercambios, mensajes, etc.).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteUserId != null && handleDeleteUser(deleteUserId)}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {users.page} de {users.totalPages} ({users.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={users.page <= 1}
                        onClick={() => loadUsers(users.page - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={users.page >= users.totalPages}
                        onClick={() => loadUsers(users.page + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "productos" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Productos publicados</CardTitle>
              {productos && (
                <Button variant="outline" size="sm" onClick={() => handleExport("productos")} disabled={!!exporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {exporting === "productos" ? "..." : "Excel"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!productos ? (
                <Button variant="outline" onClick={() => loadProductos()}>
                  Cargar productos
                </Button>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Vendedor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productos.data.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.id}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{p.titulo}</TableCell>
                          <TableCell>{p.precio} IX</TableCell>
                          <TableCell>{p.status}</TableCell>
                          <TableCell>{p.vendedor?.nombre}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {productos.page} de {productos.totalPages} ({productos.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={productos.page <= 1}
                        onClick={() => loadProductos(productos.page - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={productos.page >= productos.totalPages}
                        onClick={() => loadProductos(productos.page + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "intercambios" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transacciones (intercambios)</CardTitle>
              {intercambios && (
                <Button variant="outline" size="sm" onClick={() => handleExport("intercambios")} disabled={!!exporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {exporting === "intercambios" ? "..." : "Excel"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!intercambios ? (
                <Button variant="outline" onClick={() => loadIntercambios()}>
                  Cargar transacciones
                </Button>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Comprador</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {intercambios.data.map((i: any) => (
                        <TableRow key={i.id}>
                          <TableCell>{i.id}</TableCell>
                          <TableCell>{i.usuario?.nombre}</TableCell>
                          <TableCell>{i.otraPersona?.nombre}</TableCell>
                          <TableCell>{i.creditos} IX</TableCell>
                          <TableCell>{i.estado}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {intercambios.page} de {intercambios.totalPages} ({intercambios.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={intercambios.page <= 1}
                        onClick={() => loadIntercambios(intercambios.page - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={intercambios.page >= intercambios.totalPages}
                        onClick={() => loadIntercambios(intercambios.page + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "newsletter" && (
          <Card>
            <CardHeader>
              <CardTitle>Newsletter — Envío masivo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Redactá el correo con formato, imágenes (URL) y enlaces. Se enviará a todos los usuarios no baneados.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Asunto</Label>
                  <Input
                    id="subject"
                    value={newsletter.subject}
                    onChange={(e) => setNewsletter((s) => ({ ...s, subject: e.target.value }))}
                    placeholder="Asunto del correo"
                    required
                  />
                </div>
                <div>
                  <Label>Cuerpo del correo</Label>
                  <div className="rounded-md border border-input [&_.ql-editor]:min-h-[200px] [&_.ql-container]:border-0 [&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:bg-muted/50 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-input">
                    <ReactQuill
                      theme="snow"
                      value={newsletter.bodyHtml}
                      onChange={(html) => setNewsletter((s) => ({ ...s, bodyHtml: html }))}
                      modules={quillModules}
                      placeholder="Escribí el contenido del newsletter. Podés usar negrita, listas, enlaces e imágenes (insertar imagen → pegar URL)."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enviarATodos"
                    checked={newsletter.enviarATodos}
                    onChange={(e) => setNewsletter((s) => ({ ...s, enviarATodos: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="enviarATodos">Enviar a todos los usuarios registrados</Label>
                </div>
                {newsletterResult && (
                  <p className={`text-sm ${newsletterResult.startsWith("Enviados") ? "text-green-600" : "text-destructive"}`}>
                    {newsletterResult}
                  </p>
                )}
                <Button type="submit" variant="gold" disabled={newsletterSending}>
                  {newsletterSending ? "Enviando..." : "Enviar newsletter"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
