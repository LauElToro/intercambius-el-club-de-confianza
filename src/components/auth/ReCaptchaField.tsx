import { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { isRecaptchaEnabled, RECAPTCHA_SITE_KEY } from '@/lib/recaptcha-config';

interface ReCaptchaFieldProps {
  onTokenChange: (token: string | null) => void;
}

/** reCAPTCHA v2 en producción; checkbox de respaldo solo si falta VITE_RECAPTCHA_SITE_KEY (dev). */
export function ReCaptchaField({ onTokenChange }: ReCaptchaFieldProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  if (!isRecaptchaEnabled) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Label className="text-center">Verificación *</Label>
        <div className="flex w-fit items-start gap-3 rounded-lg border border-border bg-surface p-4">
          <Checkbox
            id="recaptcha-dev"
            onCheckedChange={(checked) => onTokenChange(checked === true ? 'dev-bypass' : null)}
          />
          <label htmlFor="recaptcha-dev" className="cursor-pointer text-sm text-muted-foreground leading-snug">
            No soy un robot (modo desarrollo — configurá VITE_RECAPTCHA_SITE_KEY para reCAPTCHA real)
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Label className="text-center">Verificación *</Label>
      <div className="w-fit rounded-lg border border-border bg-surface p-1">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={onTokenChange}
          onExpired={() => onTokenChange(null)}
          hl="es"
        />
      </div>
    </div>
  );
}

export function resetReCaptcha(ref: React.RefObject<ReCAPTCHA | null>) {
  ref.current?.reset();
}
