export default function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={22} aria-hidden="true" />}
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  );
}
