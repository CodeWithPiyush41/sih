interface BadgeProps {
  variant: 'strong' | 'gap' | 'neutral' | 'pending' | 'danger';
  children: React.ReactNode;
}

const variants: Record<BadgeProps['variant'], string> = {
  strong: 'bg-strong-tint text-strong',
  gap: 'bg-gap-tint text-gap',
  neutral: 'bg-bg text-ink-muted border border-border',
  pending: 'bg-signal-tint text-signal',
  danger: 'bg-danger-tint text-danger',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-badge px-2 py-0.5 text-caption ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
