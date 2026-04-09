import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Paperclip, X } from "lucide-react";
import { contactService, CategoriaContacto } from "@/services/contact.service";
import { CONTACT_EMAIL } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";

const CATEGORIAS: { value: CategoriaContacto; label: string }[] = [
  { value: "consulta", label: "Consulta general" },
  { value: "queja", label: "Queja" },
  { value: "sugerencia", label: "Sugerencia" },
  { value: "otro", label: "Otro" },
];

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

const ACCEPT_TYPES =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Email inicial (ej. usuario logueado) */
  defaultEmail?: string | null;
};

export function ContactDialog({ open, onOpenChange, defaultEmail }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaContacto>("consulta");
  const [mensaje, setMensaje] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && defaultEmail) {
      setEmail((e) => e || defaultEmail);
    }
  }, [open, defaultEmail]);

  useEffect(() => {
    if (!open) {
      setSending(false);
    }
  }, [open]);

  const reset = () => {
    setEmail(defaultEmail || "");
    setNombre("");
    setCategoria("consulta");
    setMensaje("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    e.target.value = "";
    const next: File[] = [...files];
    for (const f of list) {
      if (next.length >= MAX_FILES) {
        toast({
          title: "Límite de archivos",
          description: `Máximo ${MAX_FILES} archivos.`,
          variant: "destructive",
        });
        break;
      }
      if (f.size > MAX_BYTES) {
        toast({
          title: "Archivo demasiado grande",
          description: `${f.name} supera 5 MB.`,
          variant: "destructive",
        });
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const em = email.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    if (mensaje.trim().length < 10) {
      toast({
        title: "Mensaje muy corto",
        description: "Escribí al menos 10 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const res = await contactService.send({
        email: em,
        nombre: nombre.trim() || undefined,
        categoria,
        mensaje: mensaje.trim(),
        attachments: files.length ? files : undefined,
      });
      toast({
        title: "Mensaje enviado",
        description: res.message || "Te responderemos a la brevedad.",
      });
      handleClose(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "No se pudo enviar. Probá de nuevo o escribinos por correo.";
      toast({
        title: "No se pudo enviar",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Contactanos</DialogTitle>
          <DialogDescription>
            Quejas, sugerencias o consultas. Podés adjuntar capturas o documentos (PDF, imágenes, texto o Word).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <ScrollArea className="max-h-[min(60vh,520px)] px-6">
            <div className="space-y-4 pr-3 pb-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Tu email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-nombre">Nombre (opcional)</Label>
                <Input
                  id="contact-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Cómo te llamamos"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de mensaje</Label>
                <Select
                  value={categoria}
                  onValueChange={(v) => setCategoria(v as CategoriaContacto)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-mensaje">Mensaje *</Label>
                <Textarea
                  id="contact-mensaje"
                  required
                  rows={6}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Contanos en detalle..."
                  className="resize-y min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">Mínimo 10 caracteres.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-files-input">Archivos adjuntos (opcional)</Label>
                <input
                  id="contact-files-input"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT_TYPES}
                  className="sr-only"
                  onChange={onFilesChange}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-gold/40 hover:bg-gold/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                    Adjuntar foto o archivo
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    PDF, imágenes, TXT o Word
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hasta {MAX_FILES} archivos, máx. 5 MB c/u: JPG, PNG, GIF, WebP, PDF, TXT, DOC/DOCX.
                </p>
                {files.length > 0 && (
                  <ul className="text-sm space-y-1 border rounded-md p-2 bg-muted/30">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                        <span className="truncate flex items-center gap-1.5 min-w-0">
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{f.name}</span>
                          <span className="text-muted-foreground shrink-0 text-xs">
                            ({(f.size / 1024).toFixed(0)} KB)
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeFile(i)}
                          aria-label="Quitar archivo"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 py-4 border-t border-border flex-col sm:flex-row gap-2 shrink-0">
            <p className="text-xs text-muted-foreground mr-auto w-full sm:w-auto text-left">
              También podés escribir a{" "}
              <span className="text-foreground font-medium">{CONTACT_EMAIL}</span>
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={sending}>
                Cancelar
              </Button>
              <Button type="submit" variant="gold" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar mensaje"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
