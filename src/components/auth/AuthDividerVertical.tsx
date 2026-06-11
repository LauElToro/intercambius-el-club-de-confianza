interface AuthDividerVerticalProps {
  surface?: 'background' | 'card';
}

export function AuthDividerVertical({ surface = 'background' }: AuthDividerVerticalProps) {
  const surfaceClass = surface === 'card' ? 'bg-card' : 'bg-background';

  return (
    <div className="relative hidden lg:flex w-px self-stretch mx-1">
      <span className="absolute inset-y-0 left-0 w-px bg-border" />
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${surfaceClass} px-1 text-xs uppercase text-muted-foreground`}
      >
        o
      </span>
    </div>
  );
}
