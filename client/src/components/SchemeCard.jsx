export default function SchemeCard({ scheme, onClick }) {
  return (
    <div
      className="scheme-link"
      onClick={() => onClick(scheme.slug)}
      style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline', margin: '4px 0' }}
    >
      {scheme.name}
    </div>
  );
}