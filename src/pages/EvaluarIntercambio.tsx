import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, ArrowLeft, MessageSquareWarning } from 'lucide-react';
import { evaluacionesService } from '@/services/evaluaciones.service';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ContactDialog } from '@/components/contact/ContactDialog';
import { perfilPath, nombrePublico } from '@/lib/perfil';

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 rounded-md hover:bg-gold/10 transition-colors"
            aria-label={`${n} estrellas`}
          >
            <Star
              className={cn(
                'h-8 w-8',
                n <= value ? 'fill-gold text-gold' : 'text-muted-foreground',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const EvaluarIntercambio = () => {
  const { intercambioId } = useParams<{ intercambioId: string }>();
  const idNum = parseInt(intercambioId ?? '', 10);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [puntuacionItem, setPuntuacionItem] = useState(0);
  const [puntuacionAtencion, setPuntuacionAtencion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [contactOpen, setContactOpen] = useState(false);

  const { data: ctx, isLoading, error } = useQuery({
    queryKey: ['evaluacion', 'contexto', idNum],
    queryFn: () => evaluacionesService.getContexto(idNum),
    enabled: Number.isFinite(idNum) && idNum > 0,
  });

  const mutation = useMutation({
    mutationFn: () =>
      evaluacionesService.crear({
        intercambioId: idNum,
        puntuacionAtencion,
        puntuacionItem: ctx?.soyComprador ? puntuacionItem : null,
        comentario: comentario.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluacion'] });
      toast({ title: '¡Gracias!', description: 'Tu evaluación fue registrada.' });
      navigate('/mis-compras');
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'No se pudo enviar la evaluación';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (puntuacionAtencion < 1) {
      toast({ title: 'Falta puntuación', description: 'Calificá la atención (1 a 5).', variant: 'destructive' });
      return;
    }
    if (ctx?.soyComprador && puntuacionItem < 1) {
      toast({
        title: 'Falta puntuación',
        description: `Calificá el ${ctx.esServicio ? 'servicio' : 'producto'} (1 a 5).`,
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (error || !ctx) {
    return (
      <Layout>
        <div className="container max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">No se pudo cargar la evaluación.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </Layout>
    );
  }

  if (ctx.yaEvaluado) {
    return (
      <Layout>
        <div className="container max-w-lg mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-lg font-medium">Ya evaluaste este intercambio.</p>
          {ctx.evaluado && (
            <Button variant="outline" asChild>
              <Link to={perfilPath(ctx.evaluado)}>Ver perfil de {ctx.evaluado.nombre}</Link>
            </Button>
          )}
          <Button variant="gold" onClick={() => navigate('/mis-compras')}>
            Ir a mis compras
          </Button>
        </div>
      </Layout>
    );
  }

  const itemLabel = ctx.labels.item;
  const evaluadoNombre = ctx.evaluado ? nombrePublico(ctx.evaluado) : 'la otra parte';

  return (
    <Layout>
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>¿Cómo fue tu experiencia?</CardTitle>
            {ctx.marketItem && (
              <p className="text-sm text-muted-foreground">{ctx.marketItem.titulo}</p>
            )}
            <p className="text-sm">
              Evaluás a <strong>{evaluadoNombre}</strong>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {ctx.soyComprador && (
                <StarRating
                  label={`${itemLabel} (1 a 5)`}
                  value={puntuacionItem}
                  onChange={setPuntuacionItem}
                />
              )}
              <StarRating
                label={`${ctx.labels.atencion} (1 a 5)`}
                value={puntuacionAtencion}
                onChange={setPuntuacionAtencion}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Reseña (opcional)</p>
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Contá cómo fue la experiencia..."
                  rows={4}
                  maxLength={2000}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button type="submit" variant="gold" disabled={mutation.isPending} className="w-full">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar evaluación'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setContactOpen(true)}
                >
                  <MessageSquareWarning className="h-4 w-4" />
                  Hacer una queja
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultCategoria="queja"
      />
    </Layout>
  );
};

export default EvaluarIntercambio;
