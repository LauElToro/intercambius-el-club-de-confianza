interface AuthDividerVerticalProps {
  surface?: 'background' | 'card';
}

export function AuthDividerVertical({ surface = 'background' }: AuthDividerVerticalProps) {
  const surfaceClass = surface === 'card' ? 'bg-card' : 'bg-background';

  return (
    <div className="hidden lg:flex flex-col items-center self-stretch justify-center px-1">
      <span className="h-6 w-px bg-border" />
      <span className={`${surfaceClass} py-2 text-xs uppercase text-muted-foreground`}>o</span>
      <span className="h-6 w-px bg-border" />
    </div>
  );
}
