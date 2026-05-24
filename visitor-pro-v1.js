/**
 * Visitor Pro - Gate Pass & Visitor Management Module
 * Version: 2.0.0
 * Author: LearnBee Team
 * Category: General
 *
 * A self-contained, premium visitor management module.
 * Stores all visitor logs to Supabase `visitor_logs` table.
 * Supports date-range filtering, search, status filters, and analytics.
 *
 * Props:
 *   - school       { id, name, logo_url, address, school_code }
 *   - profile      { id, full_name, role }
 *   - supabaseUrl  string  — VITE_SUPABASE_URL
 *   - anonKey      string  — VITE_SUPABASE_ANON_KEY
 *   - accessToken  string  — JWT from supabase.auth.getSession()
 */

const { useState, useEffect, useCallback, useMemo } = React;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genPassId() {
  return 'VP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
}
function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}
function elapsed(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}
function duration(cin, cout) {
  if (!cin || !cout) return '—';
  const mins = Math.floor((new Date(cout) - new Date(cin)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Status config ────────────────────────────────────────────────────────────

const ST = {
  active:    { label: 'Checked In',  bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  completed: { label: 'Checked Out', bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' },
};
const PURPOSES = ['Meeting', 'Delivery', 'Interview', 'Parent Visit', 'Vendor', 'Official', 'Inspection', 'Other'];
const ID_TYPES  = ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License', 'Other'];

// ─── Supabase REST API helpers ────────────────────────────────────────────────

function makeApi(supabaseUrl, anonKey, accessToken) {
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  async function fetchLogs(school_id, fromDate, toDate) {
    const from = fromDate ? `${fromDate}T00:00:00.000Z` : `${today()}T00:00:00.000Z`;
    const to   = toDate   ? `${toDate}T23:59:59.999Z`   : `${today()}T23:59:59.999Z`;
    const url  = `${supabaseUrl}/rest/v1/visitor_logs?school_id=eq.${school_id}&checkin_at=gte.${from}&checkin_at=lte.${to}&order=checkin_at.desc`;
    const res  = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  }

  async function insertLog(row) {
    const res = await fetch(`${supabaseUrl}/rest/v1/visitor_logs`, {
      method: 'POST', headers,
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error('Failed to save visitor: ' + (errText || res.statusText));
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  async function checkoutLog(id) {
    const res = await fetch(`${supabaseUrl}/rest/v1/visitor_logs?id=eq.${id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ status: 'completed', checkout_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error('Checkout failed: ' + (errText || res.statusText));
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  async function fetchStats(school_id) {
    // total all-time
    const allRes = await fetch(`${supabaseUrl}/rest/v1/visitor_logs?school_id=eq.${school_id}&select=id,status,purpose`, { headers });
    const all = await allRes.json();
    return all;
  }

  return { fetchLogs, insertLog, checkoutLog, fetchStats };
}

// ─── Real Scannable QR Code ───────────────────────────────────────────────────
// Uses api.qrserver.com to generate a real QR image that can be scanned

function MiniQR({ value, size }) {
  const px = size || 80;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=1e293b&margin=2&format=png`;
  return React.createElement('img', {
    src: url,
    alt: 'QR Code',
    width: px,
    height: px,
    style: { borderRadius: 4, border: '1px solid #e2e8f0', display: 'block' }
  });
}

// ─── Public Visitor Pass Page (scanned from QR) ───────────────────────────────

function VisitorPassPage({ passId, supabaseUrl, anonKey }) {
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!passId || !supabaseUrl || !anonKey) { setLoading(false); setNotFound(true); return; }
    const url = `${supabaseUrl}/rest/v1/visitor_logs?pass_id=eq.${encodeURIComponent(passId)}&select=*`;
    fetch(url, { headers: { 'apikey': anonKey, 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(rows => {
        if (rows && rows.length > 0) setVisitor(rows[0]);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [passId]);

  const statusColor = visitor?.status === 'active' ? '#16a34a' : '#64748b';
  const statusLabel = visitor?.status === 'active' ? '🟢 Currently Inside' : '✅ Checked Out';

  if (loading) return React.createElement('div', { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui' } },
    React.createElement('div', { style: { textAlign: 'center', color: '#94a3b8' } },
      React.createElement('div', { style: { fontSize: 40, marginBottom: 12 } }, '⏳'),
      React.createElement('div', { style: { fontSize: 15, fontWeight: 600 } }, 'Verifying pass...')
    )
  );

  if (notFound || !visitor) return React.createElement('div', { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui' } },
    React.createElement('div', { style: { textAlign: 'center', background: '#fff', padding: '40px 32px', borderRadius: 20, border: '1px solid #e2e8f0', maxWidth: 380, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } },
      React.createElement('div', { style: { fontSize: 40, marginBottom: 12 } }, '❌'),
      React.createElement('h2', { style: { margin: '0 0 8px', color: '#1e293b', fontSize: 18 } }, 'Pass Not Found'),
      React.createElement('p', { style: { margin: 0, color: '#64748b', fontSize: 13 } }, `No visitor record found for pass: ${passId}`)
    )
  );

  return React.createElement('div', { style: { minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, sans-serif' } },
    React.createElement('div', { style: { background: '#fff', borderRadius: 24, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(99,102,241,0.15)', overflow: 'hidden' } },
      // Header strip
      React.createElement('div', { style: { height: 8, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' } }),
      // Title bar
      React.createElement('div', { style: { padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12 } },
        React.createElement('div', { style: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 } }, '🎫'),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: 1 } }, 'VISITOR GATE PASS'),
          React.createElement('div', { style: { fontSize: 15, fontWeight: 800, color: '#1e293b' } }, 'Verification Card')
        )
      ),
      // Status badge
      React.createElement('div', { style: { margin: '16px 24px 0', padding: '10px 16px', background: visitor.status === 'active' ? '#dcfce7' : '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement('div', { style: { width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0 } }),
        React.createElement('span', { style: { fontSize: 13, fontWeight: 700, color: statusColor } }, statusLabel)
      ),
      // Details grid
      React.createElement('div', { style: { padding: '16px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } },
        [['Pass ID', visitor.pass_id], ['Visitor Name', visitor.visitor_name], ['Phone', visitor.phone], ['Purpose', visitor.purpose], ['Meeting With', `${visitor.host_name || '—'} ${visitor.host_dept ? `(${visitor.host_dept})` : ''}`], ['ID Proof', visitor.id_type || '—']]
          .map(([label, val]) => React.createElement('div', { key: label },
            React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 } }, label),
            React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' } }, val || '—')
          ))
      ),
      // Times
      React.createElement('div', { style: { margin: '16px 24px 0', padding: '12px 16px', background: '#f8fafc', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 } }, 'Check-In'),
          React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: '#16a34a' } }, visitor.checkin_at ? new Date(visitor.checkin_at).toLocaleString('en-IN') : '—')
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 } }, 'Check-Out'),
          React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: '#64748b' } }, visitor.checkout_at ? new Date(visitor.checkout_at).toLocaleString('en-IN') : 'Still Inside')
        )
      ),
      // Footer
      React.createElement('div', { style: { padding: '16px 24px 24px', textAlign: 'center', marginTop: 8 } },
        React.createElement('div', { style: { fontSize: 11, color: '#94a3b8' } }, '🔒 Verified by Visitor Pro · LearnBee ERP')
      )
    )
  );
}

// ─── Print Logs View (Print-only Logs layout) ────────────────────────────────

function PrintLogsView({ visitors, school }) {
  return React.createElement('div', { id: 'vp-print-logs-container', style: { display: 'none' } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 20, fontFamily: 'system-ui, sans-serif' } },
      React.createElement('div', null,
        React.createElement('h1', { style: { margin: 0, fontSize: 20, fontWeight: 'bold', color: '#1e293b' } }, school?.name || 'School Visitor Logs'),
        React.createElement('p', { style: { margin: '4px 0 0', fontSize: 12, color: '#64748b' } }, 'Official Visitor Registration Records')
      ),
      React.createElement('div', { style: { textAlign: 'right', fontSize: 11, color: '#64748b' } },
        React.createElement('p', { style: { margin: 0 } }, `Report Date: ${new Date().toLocaleDateString('en-IN')}`),
        React.createElement('p', { style: { margin: 0 } }, `Total Records: ${visitors.length}`)
      )
    ),
    React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'system-ui, sans-serif' } },
      React.createElement('thead', null,
        React.createElement('tr', { style: { borderBottom: '1.5px solid #000', background: '#f8fafc' } },
          ['Pass ID', 'Visitor Name', 'Phone', 'Purpose', 'Person to Meet', 'Check-In', 'Check-Out', 'Status'].map(h =>
            React.createElement('th', { key: h, style: { padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#475569' } }, h)
          )
        )
      ),
      React.createElement('tbody', null,
        visitors.length === 0 
          ? React.createElement('tr', null, React.createElement('td', { colSpan: 8, style: { padding: 20, textAlign: 'center', color: '#94a3b8' } }, 'No records found for the selected range.'))
          : visitors.map(v =>
              React.createElement('tr', { key: v.id, style: { borderBottom: '1px solid #e2e8f0' } },
                React.createElement('td', { style: { padding: '8px 6px', fontWeight: 'bold', color: '#1e293b' } }, v.pass_id),
                React.createElement('td', { style: { padding: '8px 6px', color: '#334155' } }, v.visitor_name),
                React.createElement('td', { style: { padding: '8px 6px', color: '#334155' } }, v.phone),
                React.createElement('td', { style: { padding: '8px 6px', color: '#334155' } }, v.purpose),
                React.createElement('td', { style: { padding: '8px 6px', color: '#334155' } }, `${v.host_name || '—'} (${v.host_dept || '—'})`),
                React.createElement('td', { style: { padding: '8px 6px', color: '#334155' } }, `${v.checkin_at ? new Date(v.checkin_at).toLocaleDateString('en-IN') : '—'} ${v.checkin_at ? new Date(v.checkin_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}`),
                React.createElement('td', { style: { padding: '8px 6px', color: '#334155' } }, v.status === 'completed' && v.checkout_at ? `${new Date(v.checkout_at).toLocaleDateString('en-IN')} ${new Date(v.checkout_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : '—'),
                React.createElement('td', { style: { padding: '8px 6px', fontWeight: 'bold', color: v.status === 'active' ? '#16a34a' : '#64748b' } }, v.status === 'active' ? 'Inside' : 'Checked Out')
              )
            )
      )
    )
  );
}

// ─── Excel/CSV Export helper ────────────────────────────────────────────────
// Generates a standard CSV file which opens flawlessly in Excel and all spreadsheet apps.

function exportToExcel(visitors, fromDate, toDate, schoolName) {
  // Helper to escape CSV cell values (wrap in quotes if contains commas/quotes)
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const fmtDT = (iso) => iso ? new Date(iso).toLocaleString('en-IN') : '';

  const headers = ['Pass ID', 'Visitor Name', 'Phone', 'Purpose', 'Meeting With', 'Dept/Section', 'ID Proof', 'Vehicle No', 'Check-In', 'Check-Out', 'Status', 'Notes'];

  const rows = visitors.map(v => [
    v.pass_id,
    v.visitor_name,
    v.phone,
    v.purpose,
    v.host_name,
    v.host_dept,
    v.id_type,
    v.vehicle_no,
    fmtDT(v.checkin_at),
    v.checkout_at ? fmtDT(v.checkout_at) : '',
    v.status === 'active' ? 'Inside' : 'Checked Out',
    v.notes
  ].map(escapeCsv).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel UTF-8 support

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visitor-log_${fromDate}_to_${toDate}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

// ─── Gate Pass print helper ────────────────────────────────────────────────
// Opens a dedicated print window with only the gate pass HTML.
// This avoids CSS @media print conflicts with the dashboard.

function printGatePass(visitor, schoolName, schoolAddress, passUrl) {
  const fmtD = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const fmtT = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true }) : '—';
  const passId   = visitor.pass_id || visitor.passId || 'VP-000';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(passUrl)}&bgcolor=ffffff&color=1e293b&margin=2&format=png`;

  const receiptHtml = (copy, badgeColor) => `
    <div class="receipt">
      <div class="top-bar"></div>
      <div class="head">
        <div>
          <div class="gate-label">🏫 GATE PASS</div>
          <p class="school-name">${schoolName || 'School'}</p>
          <p class="school-addr">${schoolAddress || ''}</p>
        </div>
        <img src="${qrApiUrl}" width="80" height="80" alt="QR" style="border:1px solid #e2e8f0;border-radius:4px">
      </div>
      <div class="grid">
        <div><div class="lbl">Visitor Name</div><div class="val">${visitor.visitor_name || ''}</div></div>
        <div><div class="lbl">Pass ID</div><div class="val">${passId}</div></div>
        <div><div class="lbl">Phone</div><div class="val">${visitor.phone || ''}</div></div>
        <div><div class="lbl">ID Proof</div><div class="val">${visitor.id_type || ''}</div></div>
        <div><div class="lbl">Purpose</div><div class="val">${visitor.purpose || ''}</div></div>
        <div><div class="lbl">Meeting With</div><div class="val">${visitor.host_name || ''}${visitor.host_dept ? ' (' + visitor.host_dept + ')' : ''}</div></div>
        <div><div class="lbl">Check-In</div><div class="val">${fmtD(visitor.checkin_at)}, ${fmtT(visitor.checkin_at)}</div></div>
        <div><div class="lbl">Vehicle No.</div><div class="val">${visitor.vehicle_no || 'N/A'}</div></div>
      </div>
      <div class="divider"></div>
      <div class="foot">
        <span class="issued">Issued by: Visitor Pro · LearnBee ERP</span>
        <span class="badge" style="background:${badgeColor}">${copy}</span>
      </div>
    </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Gate Pass — ${passId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background:#f8fafc; padding:24px; color:#1e293b; }
    h2 { font-size:13px; color:#6366f1; font-weight:700; text-align:center; letter-spacing:1px; margin-bottom:4px; }
    p.sub { font-size:11px; color:#94a3b8; text-align:center; margin-bottom:20px; }
    .receipt { background:#fff; border:2px dashed #cbd5e1; border-radius:16px; padding:24px; position:relative; overflow:hidden; page-break-inside:avoid; margin-bottom:16px; }
    .top-bar { height:8px; background:linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4); position:absolute; top:0; left:0; right:0; border-radius:6px 6px 0 0; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; padding-top:12px; margin-bottom:20px; }
    .gate-label { font-size:11px; color:#6366f1; font-weight:700; margin-bottom:4px; letter-spacing:1px; }
    .school-name { font-size:17px; font-weight:800; color:#1e293b; margin-bottom:4px; }
    .school-addr { font-size:11px; color:#94a3b8; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 24px; margin-bottom:16px; }
    .lbl { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.8px; margin-bottom:2px; }
    .val { font-size:13px; font-weight:600; color:#1e293b; }
    .divider { height:1px; background:repeating-linear-gradient(90deg,#e2e8f0 0,#e2e8f0 6px,transparent 6px,transparent 12px); margin:16px 0; }
    .foot { display:flex; justify-content:space-between; align-items:center; }
    .issued { font-size:11px; color:#94a3b8; }
    .badge { font-size:10px; font-weight:800; color:#fff; padding:4px 10px; border-radius:12px; letter-spacing:1px; }
  </style>
</head><body>
  <h2>🎫 GATE PASS</h2>
  <p class="sub">— School Copy (top) &amp; Visitor Copy (bottom) —</p>
  ${receiptHtml('SCHOOL COPY', '#6366f1')}
  ${receiptHtml('VISITOR COPY', '#10b981')}
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
</body></html>`;

  const pw = window.open('', '_blank', 'width=720,height=900');
  if (pw) { pw.document.write(html); pw.document.close(); }
}

// ─── Gate Pass Modal ──────────────────────────────────────────────────────────

function GatePassModal({ visitor, school, onClose }) {
  const passUrl = `${window.location.origin}${window.location.pathname}?vp_pass=${encodeURIComponent(visitor.pass_id || visitor.passId || 'VP-000')}`;
  const handlePrint = () => printGatePass(visitor, school?.name, school?.address, passUrl);
  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    wrap:    { background: '#f8fafc', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' },
    toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', borderRadius: '20px 20px 0 0' },
    area:    { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
    receipt: { background: '#fff', border: '2px dashed #cbd5e1', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" },
    topBar:  { height: 8, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)', position: 'absolute', top: 0, left: 0, right: 0, borderRadius: '6px 6px 0 0' },
    head:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 12, marginBottom: 20 },
    grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 16 },
    lbl:     { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 },
    val:     { fontSize: 13, fontWeight: 600, color: '#1e293b' },
    divider: { height: 1, background: 'repeating-linear-gradient(90deg,#e2e8f0 0,#e2e8f0 6px,transparent 6px,transparent 12px)', margin: '16px 0' },
    foot:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    pill:    (bg) => ({ fontSize: 10, fontWeight: 800, color: '#fff', background: bg, padding: '4px 10px', borderRadius: 12, letterSpacing: '1px' }),
    btn:     (bg, c) => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: bg, color: c, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }),
  };

  const Info = ({ l, v }) => React.createElement('div', null,
    React.createElement('div', { style: s.lbl }, l),
    React.createElement('div', { style: s.val }, v || '—')
  );

  const Receipt = ({ copy, bg }) => React.createElement('div', { style: s.receipt },
    React.createElement('div', { style: s.topBar }),
    React.createElement('div', { style: s.head },
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 11, color: '#6366f1', fontWeight: 700, marginBottom: 4, letterSpacing: 1 } }, '🏫 GATE PASS'),
        React.createElement('p', { style: { margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#1e293b' } }, school?.name || 'School'),
        React.createElement('p', { style: { margin: 0, fontSize: 11, color: '#94a3b8' } }, school?.address || '')
      ),
      React.createElement(MiniQR, { value: passUrl, size: 80 })
    ),
    React.createElement('div', { style: s.grid },
      React.createElement(Info, { l: 'Visitor Name', v: visitor.visitor_name || visitor.name }),
      React.createElement(Info, { l: 'Pass ID', v: visitor.pass_id || visitor.passId }),
      React.createElement(Info, { l: 'Phone', v: visitor.phone }),
      React.createElement(Info, { l: 'ID Proof', v: visitor.id_type }),
      React.createElement(Info, { l: 'Purpose', v: visitor.purpose }),
      React.createElement(Info, { l: 'Meeting With', v: `${visitor.host_name || visitor.host}${visitor.host_dept ? ` (${visitor.host_dept})` : ''}` }),
      React.createElement(Info, { l: 'Check-In', v: `${fmtDate(visitor.checkin_at || visitor.checkin)}, ${fmtTime(visitor.checkin_at || visitor.checkin)}` }),
      React.createElement(Info, { l: 'Vehicle No.', v: visitor.vehicle_no || visitor.vehicleNo || 'N/A' }),
    ),
    React.createElement('div', { style: s.divider }),
    React.createElement('div', { style: s.foot },
      React.createElement('span', { style: { fontSize: 11, color: '#94a3b8' } }, 'Issued by: Visitor Pro · LearnBee ERP'),
      React.createElement('span', { style: s.pill(bg) }, copy)
    )
  );

  return React.createElement('div', { style: s.overlay, onClick: e => e.target === e.currentTarget && onClose() },
    React.createElement('div', { style: s.wrap },
      React.createElement('div', { style: s.toolbar },
        React.createElement('div', null,
          React.createElement('h3', { style: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' } }, '🎫 Gate Pass'),
          React.createElement('p', { style: { margin: '2px 0 0', fontSize: 12, color: '#94a3b8' } }, `Pass ID: ${visitor.pass_id || visitor.passId}`)
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement('button', { onClick: handlePrint, style: s.btn('linear-gradient(135deg,#6366f1,#4f46e5)', '#fff') }, '🖨️ Print'),
          React.createElement('button', { onClick: onClose, style: s.btn('#f1f5f9', '#475569') }, '✕ Close')
        )
      ),
      React.createElement('div', { style: s.area, id: 'vp-print-area' },
        React.createElement('p', { style: { textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: 0 } }, '— School Copy (top) & Visitor Copy (bottom) —'),
        React.createElement(Receipt, { copy: 'SCHOOL COPY', bg: '#6366f1' }),
        React.createElement(Receipt, { copy: 'VISITOR COPY', bg: '#10b981' })
      )
    )
  );
}

// ─── Shared form field wrapper (TOP-LEVEL — must NOT be inside CheckInModal) ────────
// Defining this inside a component causes React to remount it on every keystroke,
// losing input focus. Keeping it at module-level ensures a stable component identity.

const FIELD_LABEL_STYLE = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' };

function Fld({ lbl, children }) {
  return React.createElement('div', null,
    React.createElement('label', { style: FIELD_LABEL_STYLE }, lbl),
    children
  );
}

// ─── Check-In Form ────────────────────────────────────────────────────────────

function CheckInModal({ onClose, onSubmit, submitting, error }) {
  const [f, setF] = useState({ visitor_name: '', phone: '', purpose: 'Meeting', host_name: '', host_dept: '', vehicle_no: '', id_type: 'Aadhaar', notes: '' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    panel:   { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
    head:    { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.08))', borderRadius: '20px 20px 0 0' },
    body:    { padding: 24 },
    row:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
    lbl:     { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
    inp:     { width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    sel:     { width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    btn:     { width: '100%', padding: '13px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 },
  };


  return React.createElement('div', { style: s.overlay, onClick: e => e.target === e.currentTarget && onClose() },
    React.createElement('div', { style: s.panel },
      React.createElement('div', { style: s.head },
        React.createElement('div', null,
          React.createElement('h3', { style: { margin: 0, fontSize: 17, fontWeight: 800, color: '#1e293b' } }, '🚶 Check-In Visitor'),
          React.createElement('p', { style: { margin: '4px 0 0', fontSize: 12, color: '#64748b' } }, 'Enter details to issue a gate pass and save to records.')
        ),
        React.createElement('button', { onClick: onClose, style: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' } }, '✕')
      ),
      React.createElement('form', { onSubmit: e => { e.preventDefault(); onSubmit(f); }, style: s.body },
        error && React.createElement('div', { style: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 } }, '⚠️ ' + error),
        React.createElement('div', { style: s.row },
          React.createElement(Fld, { lbl: 'Visitor Name *' }, React.createElement('input', { required: true, style: s.inp, placeholder: 'Full Name', value: f.visitor_name, onChange: e => set('visitor_name', e.target.value) })),
          React.createElement(Fld, { lbl: 'Phone Number *' }, React.createElement('input', { required: true, style: s.inp, placeholder: '10-digit mobile', value: f.phone, onChange: e => set('phone', e.target.value), maxLength: 10 }))
        ),
        React.createElement('div', { style: s.row },
          React.createElement(Fld, { lbl: 'Purpose *' }, React.createElement('select', { required: true, style: s.sel, value: f.purpose, onChange: e => set('purpose', e.target.value) }, PURPOSES.map(p => React.createElement('option', { key: p }, p)))),
          React.createElement(Fld, { lbl: 'ID Proof Type' }, React.createElement('select', { style: s.sel, value: f.id_type, onChange: e => set('id_type', e.target.value) }, ID_TYPES.map(p => React.createElement('option', { key: p }, p))))
        ),
        React.createElement('div', { style: s.row },
          React.createElement(Fld, { lbl: 'Person to Meet *' }, React.createElement('input', { required: true, style: s.inp, placeholder: 'e.g. Mr. Sharma', value: f.host_name, onChange: e => set('host_name', e.target.value) })),
          React.createElement(Fld, { lbl: 'Dept / Section' }, React.createElement('input', { style: s.inp, placeholder: 'e.g. Class 10-A Teacher', value: f.host_dept, onChange: e => set('host_dept', e.target.value) }))
        ),
        React.createElement('div', { style: s.row },
          React.createElement(Fld, { lbl: 'Vehicle Number' }, React.createElement('input', { style: s.inp, placeholder: 'e.g. DL-01-AB-1234', value: f.vehicle_no, onChange: e => set('vehicle_no', e.target.value) })),
          React.createElement(Fld, { lbl: 'Notes' }, React.createElement('input', { style: s.inp, placeholder: 'Optional notes...', value: f.notes, onChange: e => set('notes', e.target.value) }))
        ),
        React.createElement('button', { type: 'submit', disabled: submitting, style: { ...s.btn, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' } },
          submitting ? '⏳ Saving...' : '✅ Check-In & Issue Gate Pass'
        )
      )
    )
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg, color, sub }) {
  const [hov, setHov] = useState(false);
  return React.createElement('div', {
    style: { background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s, transform 0.2s', transform: hov ? 'translateY(-2px)' : 'none' },
    onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false),
  },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 } },
      React.createElement('div', { style: { width: 38, height: 38, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 } }, icon),
      React.createElement('span', { style: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' } }, label)
    ),
    React.createElement('div', { style: { fontSize: 30, fontWeight: 800, color } }, value),
    sub && React.createElement('div', { style: { fontSize: 11, color: '#94a3b8' } }, sub)
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function VisitorProDashboard({ school, profile, supabaseUrl, anonKey, accessToken }) {
  const [visitors, setVisitors]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [showCheckIn, setShowCheckIn]   = useState(false);
  const [showPass, setShowPass]         = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [fromDate, setFromDate]         = useState(today());
  const [toDate, setToDate]             = useState(today());
  const [activeTab, setActiveTab]       = useState('log');     // 'log' | 'analytics'
  const [allTimeStats, setAllTimeStats] = useState([]);
  const [checkingOut, setCheckingOut]   = useState(null);

  const hasApi = supabaseUrl && anonKey && accessToken;
  const api    = hasApi ? makeApi(supabaseUrl, anonKey, accessToken) : null;

  // ── Fetch logs ───────────────────────────────────────────────────────────

  const loadLogs = useCallback(async () => {
    if (!api || !school?.id) return;
    setLoading(true);
    try {
      const rows = await api.fetchLogs(school.id, fromDate, toDate);
      setVisitors(rows);
    } catch (e) {
      console.error('[VisitorPro] fetchLogs:', e.message);
    } finally {
      setLoading(false);
    }
  }, [school?.id, fromDate, toDate]);

  const loadStats = useCallback(async () => {
    if (!api || !school?.id) return;
    try {
      const rows = await api.fetchStats(school.id);
      setAllTimeStats(rows);
    } catch (e) {
      console.error('[VisitorPro] fetchStats:', e.message);
    }
  }, [school?.id]);

  useEffect(() => { loadLogs(); loadStats(); }, [loadLogs, loadStats]);

  // Reload when date range changes
  useEffect(() => { if (hasApi) loadLogs(); }, [fromDate, toDate]);

  // ── Check-In handler ─────────────────────────────────────────────────────

  const handleCheckIn = useCallback(async (form) => {
    setSubmitting(true);
    setSubmitError('');
    const passId = genPassId();
    const rowId = genUUID();
    const row = {
      id:           rowId,
      school_id:    school?.id,
      pass_id:      passId,
      visitor_name: form.visitor_name,
      phone:        form.phone,
      purpose:      form.purpose,
      host_name:    form.host_name,
      host_dept:    form.host_dept,
      vehicle_no:   form.vehicle_no,
      id_type:      form.id_type,
      notes:        form.notes,
      status:       'active',
      checkin_at:   new Date().toISOString(),
      created_by:   profile?.id || null,
    };
    try {
      let saved;
      if (api) {
        let res;
        try {
          res = await api.insertLog(row);
        } catch (insertErr) {
          // If foreign key constraint on profiles fails (e.g. because profile.id is not in profiles table), retry with created_by = null
          const isFkeyError = insertErr.message && (
            insertErr.message.includes('foreign key') ||
            insertErr.message.includes('violates') ||
            insertErr.message.includes('created_by')
          );
          if (isFkeyError && row.created_by !== null) {
            console.warn('[VisitorPro] Retry insert without created_by due to constraint:', insertErr.message);
            const fallbackRow = { ...row, created_by: null };
            res = await api.insertLog(fallbackRow);
          } else {
            throw insertErr;
          }
        }
        const parsed = Array.isArray(res) ? res[0] : res;
        // Hardened: If the response is empty (but didn't throw), use the local object with the pre-generated rowId
        saved = parsed && parsed.id ? parsed : row;
      } else {
        // fallback: local only
        saved = row;
      }
      setVisitors(v => [saved, ...v]);
      setShowCheckIn(false);
      setShowPass(saved);
      loadStats();
    } catch (e) {
      setSubmitError(e.message || 'Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [school?.id, profile?.id, api, loadStats]);

  // ── Check-Out handler ────────────────────────────────────────────────────

  const handleCheckOut = useCallback(async (id) => {
    setCheckingOut(id);
    const checkoutTime = new Date().toISOString();
    try {
      if (api) await api.checkoutLog(id);
      setVisitors(v => v.map(x => x.id === id ? { ...x, status: 'completed', checkout_at: checkoutTime } : x));
    } catch (e) {
      alert('Checkout failed: ' + e.message);
    } finally {
      setCheckingOut(null);
    }
  }, [api]);

  // ── Filtered list ────────────────────────────────────────────────────────

  const filtered = useMemo(() => visitors.filter(v => {
    const name = v.visitor_name || '';
    const q = search.toLowerCase();
    const matchSearch = name.toLowerCase().includes(q) ||
      (v.purpose || '').toLowerCase().includes(q) ||
      (v.host_name || '').toLowerCase().includes(q) ||
      (v.pass_id || '').toLowerCase().includes(q) ||
      (v.phone || '').includes(q);
    const matchStatus  = statusFilter  === 'all' || v.status  === statusFilter;
    const matchPurpose = purposeFilter === 'all' || v.purpose === purposeFilter;
    return matchSearch && matchStatus && matchPurpose;
  }), [visitors, search, statusFilter, purposeFilter]);

  // ── Analytics ────────────────────────────────────────────────────────────

  const analytics = useMemo(() => {
    const src = allTimeStats.length ? allTimeStats : visitors;
    const byPurpose = {};
    src.forEach(v => { byPurpose[v.purpose] = (byPurpose[v.purpose] || 0) + 1; });
    const sorted = Object.entries(byPurpose).sort((a, b) => b[1] - a[1]);
    const total  = src.length;
    return { byPurpose: sorted, total, active: src.filter(v => v.status === 'active').length };
  }, [allTimeStats, visitors]);

  // ── Styles ───────────────────────────────────────────────────────────────

  const s = {
    page:    { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', system-ui, sans-serif" },
    topbar:  { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    content: { padding: 28 },
    stats:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
    tabs:    { display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 20, width: 'fit-content' },
    tab:     (a) => ({ padding: '8px 20px', borderRadius: 9, border: 'none', background: a ? '#fff' : 'transparent', color: a ? '#6366f1' : '#64748b', fontWeight: a ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: a ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }),
    toolbar: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
    searchW: { display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '0 14px', gap: 8, flex: 1, minWidth: 200, maxWidth: 320 },
    searchI: { border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#1e293b', padding: '10px 0', fontFamily: 'inherit', width: '100%' },
    selBtn:  { padding: '9px 12px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' },
    dateRow: { display: 'flex', gap: 8, alignItems: 'center' },
    dateInp: { padding: '9px 12px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#1e293b', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' },
    addBtn:  { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', whiteSpace: 'nowrap', marginLeft: 'auto' },
    table:   { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    th:      { padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' },
    td:      { padding: '13px 16px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
    sPill:   (st) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: ST[st]?.bg || '#f1f5f9', color: ST[st]?.color || '#64748b' }),
    sDot:    (st) => ({ width: 7, height: 7, borderRadius: '50%', background: ST[st]?.dot || '#94a3b8', animation: st === 'active' ? 'vp-pulse 2s infinite' : 'none' }),
    aBtn:    (bg, c) => ({ padding: '6px 11px', background: bg, color: c, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'opacity 0.15s' }),
    reloadBtn: { padding: '9px 14px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  };

  const activeToday  = visitors.filter(v => v.status === 'active').length;
  const todayTotal   = visitors.length;
  const completedToday = visitors.filter(v => v.status === 'completed').length;
  const topPurpose   = analytics.byPurpose[0]?.[0] || '—';

  return React.createElement('div', { style: s.page },

    // ── Topbar ──────────────────────────────────────────────────────────────
    React.createElement('div', { style: s.topbar },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        React.createElement('div', { style: { fontSize: 26 } }, '🎫'),
        React.createElement('div', null,
          React.createElement('h1', { style: { margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' } }, 'Visitor Pro'),
          React.createElement('p', { style: { margin: 0, fontSize: 11, color: '#94a3b8' } }, `${school?.name || '—'} · Gate Pass & Visitor Management`)
        )
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        !hasApi && React.createElement('span', { style: { fontSize: 11, background: '#fef9c3', color: '#ca8a04', padding: '4px 10px', borderRadius: 8, fontWeight: 600 } }, '⚠️ Offline Mode'),
        React.createElement('div', { style: { fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '6px 12px', borderRadius: 8 } }, `🕐 ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`),
        React.createElement('div', { style: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' } },
          (profile?.full_name || 'A').charAt(0)
        )
      )
    ),

    // ── Content ──────────────────────────────────────────────────────────────
    React.createElement('div', { style: s.content },

      // Stats row
      React.createElement('div', { style: s.stats },
        React.createElement(StatCard, { icon: '🟢', label: 'Active Now',      value: activeToday,    bg: '#dcfce7', color: '#16a34a', sub: 'Currently inside campus' }),
        React.createElement(StatCard, { icon: '📋', label: "Today's Total",   value: todayTotal,     bg: '#ede9fe', color: '#7c3aed', sub: `${fmtDate(new Date().toISOString())}` }),
        React.createElement(StatCard, { icon: '✅', label: 'Checked Out',     value: completedToday, bg: '#f0fdf4', color: '#059669', sub: 'Completed visits today' }),
        React.createElement(StatCard, { icon: '🏷️', label: 'Top Purpose',    value: topPurpose,     bg: '#fef9c3', color: '#ca8a04', sub: 'All-time most frequent' })
      ),

      // Tabs
      React.createElement('div', { style: s.tabs },
        React.createElement('button', { style: s.tab(activeTab === 'log'),       onClick: () => setActiveTab('log') },       '📋 Visitor Log'),
        React.createElement('button', { style: s.tab(activeTab === 'analytics'), onClick: () => setActiveTab('analytics') }, '📊 Analytics')
      ),

      // ── LOG TAB ────────────────────────────────────────────────────────────
      activeTab === 'log' && React.createElement('div', null,

        // Toolbar
        React.createElement('div', { style: s.toolbar },

          // Search
          React.createElement('div', { style: s.searchW },
            React.createElement('span', { style: { fontSize: 15 } }, '🔍'),
            React.createElement('input', { style: s.searchI, placeholder: 'Name, phone, pass ID, purpose...', value: search, onChange: e => setSearch(e.target.value) })
          ),

          // Status filter
          React.createElement('select', { style: s.selBtn, value: statusFilter, onChange: e => setStatusFilter(e.target.value) },
            React.createElement('option', { value: 'all' }, '📋 All Status'),
            React.createElement('option', { value: 'active' }, '🟢 Active'),
            React.createElement('option', { value: 'completed' }, '✔️ Completed')
          ),

          // Purpose filter
          React.createElement('select', { style: s.selBtn, value: purposeFilter, onChange: e => setPurposeFilter(e.target.value) },
            React.createElement('option', { value: 'all' }, '🏷️ All Purpose'),
            ...PURPOSES.map(p => React.createElement('option', { key: p, value: p }, p))
          ),

          // Date range
          React.createElement('div', { style: s.dateRow },
            React.createElement('span', { style: { fontSize: 12, color: '#94a3b8', fontWeight: 600 } }, 'From'),
            React.createElement('input', { type: 'date', style: s.dateInp, value: fromDate, onChange: e => setFromDate(e.target.value), max: today() }),
            React.createElement('span', { style: { fontSize: 12, color: '#94a3b8', fontWeight: 600 } }, 'To'),
            React.createElement('input', { type: 'date', style: s.dateInp, value: toDate, onChange: e => setToDate(e.target.value), max: today() })
          ),

          // Reload
          React.createElement('button', { style: s.reloadBtn, onClick: loadLogs, title: 'Refresh' }, loading ? '⏳' : '🔄'),

          // Print button
          React.createElement('button', {
            style: { ...s.reloadBtn, color: '#4f46e5', fontWeight: 700, borderColor: '#c7d2fe', background: '#f5f3ff', display: 'flex', alignItems: 'center', gap: 6 },
            onClick: () => {
              const logEl = document.getElementById('vp-print-logs-container');
              if (!logEl) return;
              const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
                <title>Visitor Logs Report</title>
                <style>
                  * { box-sizing: border-box; }
                  body { font-family: system-ui, sans-serif; padding: 24px; color: #000; background: #fff; }
                  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
                  th, td { padding: 10px 8px; text-align: left; }
                  th { border-bottom: 2px solid #000; background: #f8fafc; color: #1e293b; }
                  tr { border-bottom: 1px solid #e2e8f0; }
                </style>
                </head><body>
                  ${logEl.innerHTML}
                  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
                </body></html>`;
              const pw = window.open('', '_blank');
              if (pw) { pw.document.write(html); pw.document.close(); }
            },
            title: 'Print Visitor Logs'
          }, '🖨️ Print Logs'),

          // Export Excel button
          React.createElement('button', {
            style: { ...s.reloadBtn, color: '#16a34a', fontWeight: 700, borderColor: '#bbf7d0', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 6 },
            onClick: () => exportToExcel(filtered, fromDate, toDate, school?.name),
            title: 'Export to Excel'
          }, '📊 Export Excel'),

          // Add button
          React.createElement('button', { style: s.addBtn, onClick: () => setShowCheckIn(true) }, '+ Check-In Visitor')
        ),

        // Table
        React.createElement('div', { style: s.table },
          loading ? React.createElement('div', { style: { padding: 60, textAlign: 'center', color: '#94a3b8' } }, '⏳ Loading visitor records...')
          : React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  ['Pass ID', 'Visitor', 'Purpose', 'Meeting With', 'Check-In', 'Check-Out', 'Duration', 'Status', 'Actions'].map(h =>
                    React.createElement('th', { key: h, style: s.th }, h)
                  )
                )
              ),
              React.createElement('tbody', null,
                filtered.length === 0
                  ? React.createElement('tr', null, React.createElement('td', { colSpan: 9, style: { padding: '60px 20px', textAlign: 'center', color: '#94a3b8' } },
                      React.createElement('div', { style: { fontSize: 32, marginBottom: 8 } }, '🚶'),
                      React.createElement('div', { style: { fontWeight: 700, fontSize: 15, color: '#475569', marginBottom: 4 } }, 'No visitors found'),
                      React.createElement('div', { style: { fontSize: 12 } }, visitors.length ? 'Try adjusting filters.' : 'Click "+ Check-In Visitor" to log a visit.')
                    ))
                  : filtered.map(v => React.createElement('tr', {
                      key: v.id,
                      onMouseEnter: e => e.currentTarget.style.background = '#fafbff',
                      onMouseLeave: e => e.currentTarget.style.background = 'transparent'
                    },
                      React.createElement('td', { style: { ...s.td, fontFamily: 'monospace', fontSize: 11, color: '#6366f1', fontWeight: 700 } }, v.pass_id),
                      React.createElement('td', { style: s.td },
                        React.createElement('div', { style: { fontWeight: 700, color: '#1e293b' } }, v.visitor_name),
                        React.createElement('div', { style: { fontSize: 11, color: '#94a3b8' } }, `📞 ${v.phone}`)
                      ),
                      React.createElement('td', { style: s.td },
                        React.createElement('span', { style: { background: '#f1f5f9', padding: '3px 9px', borderRadius: 6, fontSize: 12, fontWeight: 600 } }, v.purpose)
                      ),
                      React.createElement('td', { style: s.td },
                        React.createElement('div', { style: { fontWeight: 600 } }, v.host_name),
                        React.createElement('div', { style: { fontSize: 11, color: '#94a3b8' } }, v.host_dept)
                      ),
                      React.createElement('td', { style: s.td },
                        React.createElement('div', null, fmtTime(v.checkin_at)),
                        React.createElement('div', { style: { fontSize: 11, color: '#94a3b8' } }, fmtDate(v.checkin_at))
                      ),
                      React.createElement('td', { style: { ...s.td, fontSize: 12, color: '#64748b' } }, v.checkout_at ? fmtTime(v.checkout_at) : (v.status === 'active' ? React.createElement('span', { style: { color: '#22c55e', fontWeight: 700 } }, 'Active') : '—')),
                      React.createElement('td', { style: { ...s.td, fontSize: 12, color: '#64748b' } }, v.checkout_at ? duration(v.checkin_at, v.checkout_at) : (v.status === 'active' ? elapsed(v.checkin_at) : '—')),
                      React.createElement('td', { style: s.td },
                        React.createElement('span', { style: s.sPill(v.status) },
                          React.createElement('span', { style: s.sDot(v.status) }),
                          ST[v.status]?.label || v.status
                        )
                      ),
                      React.createElement('td', { style: { ...s.td, whiteSpace: 'nowrap' } },
                        React.createElement('div', { style: { display: 'flex', gap: 6 } },
                          React.createElement('button', { style: s.aBtn('rgba(99,102,241,.1)', '#4f46e5'), onClick: () => setShowPass(v) }, '🎫 Pass'),
                          v.status === 'active' && React.createElement('button', {
                            style: { ...s.aBtn('rgba(16,185,129,.1)', '#059669'), opacity: checkingOut === v.id ? 0.6 : 1 },
                            disabled: checkingOut === v.id,
                            onClick: () => handleCheckOut(v.id)
                          }, checkingOut === v.id ? '...' : '✔ Out')
                        )
                      )
                    ))
              )
            ),

          // Footer row
          React.createElement('div', { style: { padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: 12, color: '#94a3b8' } }, `Showing ${filtered.length} of ${visitors.length} records · ${fmtDate(fromDate + 'T00:00:00')} – ${fmtDate(toDate + 'T00:00:00')}`),
            React.createElement('span', { style: { fontSize: 11, color: '#c7d2fe', background: '#6366f1', padding: '4px 10px', borderRadius: 6, fontWeight: 700 } }, 'Visitor Pro v2.0')
          )
        )
      ),

      // ── ANALYTICS TAB ─────────────────────────────────────────────────────
      activeTab === 'analytics' && React.createElement('div', null,
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 } },

          // Purpose breakdown
          React.createElement('div', { style: { background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } },
            React.createElement('h3', { style: { margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#1e293b' } }, '🏷️ Visits by Purpose (All Time)'),
            analytics.byPurpose.length === 0
              ? React.createElement('p', { style: { color: '#94a3b8', fontSize: 13 } }, 'No data yet.')
              : analytics.byPurpose.map(([purpose, count]) => {
                  const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
                  const colors = { Meeting: '#6366f1', Delivery: '#f59e0b', 'Parent Visit': '#10b981', Interview: '#8b5cf6', Vendor: '#f97316', Official: '#06b6d4', Inspection: '#ec4899', Other: '#94a3b8' };
                  const clr = colors[purpose] || '#6366f1';
                  return React.createElement('div', { key: purpose, style: { marginBottom: 14 } },
                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 } },
                      React.createElement('span', { style: { fontSize: 13, fontWeight: 600, color: '#334155' } }, purpose),
                      React.createElement('span', { style: { fontSize: 13, fontWeight: 700, color: clr } }, `${count} (${pct}%)`)
                    ),
                    React.createElement('div', { style: { height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' } },
                      React.createElement('div', { style: { height: '100%', width: `${pct}%`, background: clr, borderRadius: 4, transition: 'width 0.6s ease' } })
                    )
                  );
                })
          ),

          // Daily snapshot
          React.createElement('div', { style: { background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } },
            React.createElement('h3', { style: { margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#1e293b' } }, '📅 Today\'s Snapshot'),
            [
              { label: 'Total Visits Today',     value: todayTotal,     icon: '📋', color: '#7c3aed' },
              { label: 'Currently Inside',        value: activeToday,    icon: '🟢', color: '#16a34a' },
              { label: 'Checked Out Today',       value: completedToday, icon: '✅', color: '#059669' },
              { label: 'All-Time Total Visits',   value: analytics.total, icon: '🏆', color: '#f59e0b' },
            ].map(({ label, value, icon, color }) =>
              React.createElement('div', { key: label, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f8fafc' } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                  React.createElement('span', { style: { fontSize: 18 } }, icon),
                  React.createElement('span', { style: { fontSize: 13, fontWeight: 600, color: '#475569' } }, label)
                ),
                React.createElement('span', { style: { fontSize: 22, fontWeight: 800, color } }, value)
              )
            )
          )
        )
      )
    ),

    // ── Modals ───────────────────────────────────────────────────────────────
    showCheckIn && React.createElement(CheckInModal, { onClose: () => { setShowCheckIn(false); setSubmitError(''); }, onSubmit: handleCheckIn, submitting, error: submitError }),
    showPass    && React.createElement(GatePassModal, { visitor: showPass, school, onClose: () => setShowPass(null) }),
    React.createElement(PrintLogsView, { visitors: filtered, school }),

    // ── Keyframes ────────────────────────────────────────────────────────────
    React.createElement('style', null, `
      @keyframes vp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
      @media print {
        body > *:not(#vp-print-logs-container) { display: none !important; }
        #vp-print-logs-container { display: block !important; width: 100% !important; background: #fff !important; color: #000 !important; }
      }
    `)
  );
}

// ─── Root export: QR scan router ─────────────────────────────────────────────
// This wrapper has NO hooks so the conditional return is valid per React rules.
// When a QR code is scanned, the URL contains ?vp_pass=<passId> and we show
// the public verification card. Otherwise the full dashboard is rendered.

export default function VisitorPro(props) {
  const urlPassId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('vp_pass')
    : null;
  if (urlPassId) {
    return React.createElement(VisitorPassPage, {
      passId: urlPassId,
      supabaseUrl: props.supabaseUrl,
      anonKey: props.anonKey,
    });
  }
  return React.createElement(VisitorProDashboard, props);
}
