// client/src/components/SchemeDetailModal.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SchemeDetailModal({ slug, onClose }) {
  const [scheme, setScheme] = useState(null);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API_URL}/schemes/${slug}`).then((res) => setScheme(res.data));
  }, [slug]);

  if (!slug) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: 24, borderRadius: 8, maxWidth: 500, maxHeight: '80vh', overflowY: 'auto' }}>
        {!scheme ? <p>Loading...</p> : (
          <>
            <h3>{scheme.name}</h3>
            <p>{scheme.description}</p>
            <p><strong>Benefits:</strong> {scheme.benefits}</p>
            <p><strong>Documents:</strong> {scheme.documents}</p>
            <p><strong>How to apply:</strong> {scheme.applicationSteps}</p>
            {scheme.applicationLink && <a href={scheme.applicationLink} target="_blank" rel="noreferrer">Apply Now →</a>}
            <br /><button onClick={onClose} style={{ marginTop: 12 }}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}