'use client';

import { useState } from 'react';

export default function ReportButton({ clientId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generateReport() {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch(`/api/report/${clientId}`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Report generation failed');
      } else {
        setReport(data.report);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <button onClick={generateReport} disabled={loading} style={{ padding: '8px 16px' }}>
        {loading ? 'Generating report…' : 'Generate AI Report'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {report && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'sans-serif',
          lineHeight: 1.5
        }}>
          {report}
        </div>
      )}
    </div>
  );
}
