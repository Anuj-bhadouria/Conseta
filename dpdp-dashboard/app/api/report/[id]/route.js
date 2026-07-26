import pool from '../../../../lib/db';
import { callGroq } from '../../../../lib/groq';

export async function POST(request, { params }) {
  const { id } = await params;

  try {
    const clientRes = await pool.query(`SELECT * FROM clients WHERE id = $1`, [id]);
    if (clientRes.rows.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }
    const client = clientRes.rows[0];

    const scanRes = await pool.query(
      `SELECT * FROM scans WHERE client_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
      [id]
    );
    if (scanRes.rows.length === 0) {
      return Response.json({ error: 'No scans found for this client' }, { status: 404 });
    }

    const violationsRes = await pool.query(
      `SELECT rule, severity, detail FROM violations WHERE scan_id = $1`,
      [scanRes.rows[0].id]
    );
    const violations = violationsRes.rows;

    const failsAndFlags = violations.filter(v => v.severity !== 'pass');

    const prompt = `You are a compliance assistant helping a small Indian business understand its DPDP Act (Digital Personal Data Protection Act, 2023) compliance status for the website ${client.domain}.

Below is a list of automated scan findings. Deterministic rule checks already determined the pass/flag/fail status — do NOT re-evaluate compliance yourself, only explain and draft text based on what's given.

Findings:
${violations.map(v => `- [${v.severity.toUpperCase()}] ${v.rule}: ${v.detail}`).join('\n')}

Produce three sections, clearly labeled with markdown headers:

## Plain-English Summary
2-4 short paragraphs explaining what these findings mean for a non-technical business owner, in plain English. Mention overall risk level given the deadline (Consent Manager integration mandatory Nov 13, 2026).

## Draft Consent Notice
A short, itemised, standalone consent notice draft (not bundled into generic Terms of Service) suitable for a website data-collection point, addressing the Notice & Consent finding above.

## Draft "Delete My Data" Page Copy
Short webpage copy for a data-deletion/rights-request page, addressing the Retention & Erasure and Data Principal Rights findings above.

Keep the tone plain and non-legal-jargon. Do not invent compliance facts not present in the findings above.`;

    const reportText = await callGroq(prompt);

    return Response.json({ domain: client.domain, violations, report: reportText });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
