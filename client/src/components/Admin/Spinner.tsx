export function Spinner({ size = 8, label }: { size?: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted" role="status" aria-live="polite">
      <span
        className="inline-block animate-spin rounded-full border-2 border-primary border-t-transparent"
        style={{ width: size * 4, height: size * 4 }}
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}

export default Spinner;
