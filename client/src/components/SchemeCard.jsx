export default function SchemeCard({ scheme }) {
  return (
    <div className="scheme-card">
      <h4>{scheme.name}</h4>
      <span className="scheme-tag">{scheme.category}</span>
      <p>{scheme.description}</p>
      <p><strong>Benefit:</strong> {scheme.benefits}</p>
      <p><strong>Documents:</strong> {scheme.documents.join(', ')}</p>
      <a href={scheme.applyLink} target="_blank" rel="noreferrer">Apply Now →</a>
    </div>
  );
}
