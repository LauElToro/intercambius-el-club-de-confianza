interface AuthDividerProps {
  /** Fondo del texto "o" para que coincida con la superficie detrás del divisor */
  surface?: 'background' | 'card';
}

export function AuthDivider({ surface = 'background' }: AuthDividerProps) {
  const surfaceClass = surface === 'card' ? 'bg-card' : 'bg-background';

  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className={`${surfaceClass} px-2 text-muted-foreground`}>o</span>
      </div>
    </div>
  );
}
