import type { ReactNode } from 'react';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthDividerVertical } from '@/components/auth/AuthDividerVertical';

interface AuthGoogleSplitLayoutProps {
  googlePanel: ReactNode;
  formPanel: ReactNode;
}

/** Dos columnas: Google a la izquierda, formulario a la derecha (login/registro). */
export function AuthGoogleSplitLayout({ googlePanel, formPanel }: AuthGoogleSplitLayoutProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,320px)_auto_minmax(0,1fr)] lg:gap-8">
      <div className="min-w-0">{googlePanel}</div>
      <div className="hidden min-h-[200px] lg:block">
        <AuthDividerVertical />
      </div>
      <div className="min-w-0 space-y-6">
        <div className="lg:hidden">
          <AuthDivider />
        </div>
        {formPanel}
      </div>
    </div>
  );
}
