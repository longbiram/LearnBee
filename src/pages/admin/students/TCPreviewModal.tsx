import { X, Printer } from 'lucide-react';
import type { ErpStudent } from '../../../hooks/useErpStudents';
import type { SchoolInfo } from '../../../hooks/useErpAcademics';

/* ─────────────── QR Code ─────────────── */
function QRCodeImg({ value, size = 80 }: { value: string; size?: number }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=1e3a5f&margin=4`;
  return <img src={url} alt="Verify QR" width={size} height={size} style={{ display: 'block', borderRadius: 2 }} />;
}

/* ─────────────── Barcode ─────────────── */
function BarcodeImg({ value, height = 36 }: { value: string; height?: number }) {
  const chars = `*${value}*`;
  const bars: number[] = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars.charCodeAt(i);
    bars.push(1 + (c % 3));
    bars.push(1 + ((c * 7) % 2));
  }
  const totalW = bars.reduce((a, b) => a + b, 0) * 2;
  let x = 0;
  const rects: React.ReactNode[] = [];
  bars.forEach((w, i) => {
    const px = w * 2;
    if (i % 2 === 0) rects.push(<rect key={i} x={x} y={0} width={px} height={height} fill="#1e3a5f" />);
    x += px;
  });
  return (
    <svg width={Math.min(totalW, 140)} height={height + 16} viewBox={`0 0 ${totalW} ${height + 16}`} style={{ display: 'block' }}>
      {rects}
      <text x={totalW / 2} y={height + 14} textAnchor="middle" fontSize={8.5} fill="#374151" fontFamily="monospace" letterSpacing={1}>{value}</text>
    </svg>
  );
}

/* ─────────────── Date Helpers ─────────────── */
function fmt(d: string | null | undefined) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtWords(d: string | null | undefined) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─────────────── Underlined Value Field ─────────────── */
function U({ v, w, grow }: { v: string; w?: number; grow?: boolean; center?: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      borderBottom: '1.5px solid #4b5563',
      minWidth: w ?? 90,
      flex: grow ? 1 : undefined,
      textAlign: 'center',
      fontWeight: 700,
      color: '#111827',
      padding: '0 6px',
      verticalAlign: 'bottom',
      lineHeight: 1.25,
      boxSizing: 'border-box',
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: '14pt',
    }}>
      {v || '\u00A0'}
    </span>
  );
}

/* ─────────────── Diamond Divider ─────────────── */
function DiamondDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #6366f1)' }} />
      <div style={{ width: 6, height: 6, background: '#6366f1', transform: 'rotate(45deg)', flexShrink: 0 }} />
      <div style={{ width: 4, height: 4, background: '#3b82f6', transform: 'rotate(45deg)', flexShrink: 0 }} />
      <div style={{ width: 6, height: 6, background: '#6366f1', transform: 'rotate(45deg)', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #6366f1)' }} />
    </div>
  );
}

const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');
  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body * { visibility: hidden !important; }
    #tc-doc, #tc-doc * { visibility: visible !important; }
    .print-scale-wrapper {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    #tc-doc {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 210mm !important;
      max-height: 297mm !important;
      transform: none !important;
      box-shadow: none !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 5mm !important;
      page-break-after: avoid !important;
      page-break-before: avoid !important;
    }
    .no-print { display: none !important; }
  }
`;

/* ─────────────── Body Row ─────────────── */
type BodyRow = {
  before?: string;
  val: string;
  w?: number;
  grow?: boolean;
  after?: string;
  before2?: string;
  before2w?: number;
  after2?: { val: string; grow?: boolean; w?: number; prefix?: string };
};

/* ════════════════════════════════════════════════════════
   TC PREVIEW MODAL
════════════════════════════════════════════════════════ */
export default function TCPreviewModal({
  student,
  school,
  onClose,
  className: classProp,
}: {
  student: ErpStudent;
  school: SchoolInfo | null;
  onClose: () => void;
  className: string;
}) {
  const SCALE = 0.75;

  const admNo    = student.admission_number || '—';
  const tcNo     = `TC-${String(student.id ?? '').slice(-6).padStart(6, '0').toUpperCase()}`;
  const fullName = [student.first_name, student.last_name].filter(s => s?.trim()).join(' ') || '—';
  const father   = student.father_name || student.guardian_name || '—';
  const dob      = fmt(student.date_of_birth) || '—';
  const dobW     = fmtWords(student.date_of_birth) || '—';
  const admDate  = fmt(student.created_at) || '—';
  const today    = fmt(new Date().toISOString());
  const month    = new Date().toLocaleString('en-IN', { month: 'long' });
  const year     = String(new Date().getFullYear());
  const cls      = [classProp, student.current_section].filter(s => s?.trim()).join(' – ') || '—';
  const verifyUrl = `https://school.learnbee.com/verify-tc?id=${student.id}`;

  const bodyRows: BodyRow[] = [
    { before: 'This is to certify that', val: fullName, grow: true },
    { before: 'Son / Daughter of', val: father, grow: true },
    { before: 'Date of Birth (as per school record)', val: dob, w: 105 },
    { before: '(In words)', val: dobW, grow: true },
    { before: 'Date of Admission', val: admDate, w: 105, after: '   and  Date of Withdrawal', },
    { before: '', val: today, grow: true },
    { before: 'His / Her moral character is', val: 'GOOD', w: 80, after: '.' },
    {
      before: 'Attendance for session',
      val: '2026–2027', w: 95,
      after2: { val: '205 / 220', grow: true, prefix: '  was' },
    },
    { before: 'All dues paid up to', val: month, grow: true },
    { before2: year, before2w: 55, before: '  Promoted / Detained / Studying in Class', val: cls, w: 90 },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #0f172a 60%, #1a0533 100%)', padding: '24px 20px 40px' }}
    >
      <style>{PRINT_CSS}</style>

      {/* ── Toolbar ── */}
      <div className="no-print flex gap-3 mb-5 flex-shrink-0">
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em',
            boxShadow: '0 4px 18px rgba(79,70,229,0.45)',
          }}
        >
          <Printer size={15} /> Print A4
        </button>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 22px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
            color: '#e2e8f0', fontWeight: 600, fontSize: 13,
          }}
        >
          <X size={15} /> Close
        </button>
      </div>

      {/* ── Scale wrapper ── */}
      <div className="print-scale-wrapper" style={{ width: `calc(210mm * ${SCALE})`, height: `calc(297mm * ${SCALE})`, flexShrink: 0, overflow: 'hidden' }}>
        <div
          id="tc-doc"
          style={{
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
            width: '210mm',
            height: '297mm',
            background: '#ffffff',
            boxSizing: 'border-box',
            padding: '5mm',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
            fontFamily: "'Times New Roman', Times, serif",
            position: 'relative',
            overflow: 'hidden',
          }}
        >

          {/* ── Watermark ── */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 0,
          }}>
            <span style={{
              fontSize: 100, fontWeight: 900, color: 'rgba(99,102,241,0.04)',
              transform: 'rotate(-30deg)', whiteSpace: 'nowrap',
              fontFamily: 'Georgia, serif', letterSpacing: '0.1em',
              userSelect: 'none',
            }}>TRANSFER CERTIFICATE</span>
          </div>

          {/* ── Outer border (purple) ── */}
          <div style={{
            border: '3.5px solid #6366f1', borderRadius: 10, padding: 5,
            flex: 1, minHeight: 0,
            display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
            position: 'relative', zIndex: 1,
          }}>
            {/* ── Inner border (blue) ── */}
            <div style={{
              border: '1.5px solid #3b82f6', borderRadius: 6,
              flex: 1, minHeight: 0,
              display: 'flex', flexDirection: 'column',
              padding: '12px 18px 10px', boxSizing: 'border-box',
            }}>

              {/* ══ HEADER ══ */}
              <div style={{
                display: 'grid', gridTemplateColumns: '100px 1fr 100px',
                alignItems: 'center', gap: 10, paddingBottom: 12,
                borderBottom: '2.5px solid #e0e7ff',
              }}>
                {/* Logo */}
                <div style={{
                  width: 100, height: 100, border: '2px solid #c7d2fe',
                  borderRadius: 10, overflow: 'hidden', background: '#f5f3ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {school?.logo_url
                    ? <img src={school.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ color: '#a5b4fc', fontSize: 11, textAlign: 'center', lineHeight: 1.4 }}>School<br />Logo</span>}
                </div>

                {/* School info */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 30, fontWeight: 900, color: '#1e3a8a',
                    fontFamily: 'Georgia, serif', letterSpacing: '0.07em',
                    textTransform: 'uppercase', lineHeight: 1.15,
                  }}>
                    {school?.name || 'SCHOOL NAME'}
                  </div>
                  {school?.address && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{school.address}</div>
                  )}
                  {(school?.affiliation_number || school?.dise_code) && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 5, fontSize: 12, color: '#6b7280' }}>
                      {school?.affiliation_number && (
                        <span>Affiliation No.: <strong style={{ color: '#374151' }}>{school.affiliation_number}</strong></span>
                      )}
                      {school?.dise_code && (
                        <span>UDISE Code: <strong style={{ color: '#374151' }}>{school.dise_code}</strong></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Spacer */}
                <div style={{ width: 100 }} />
              </div>

              <DiamondDivider />

              {/* ══ TC TITLE ══ */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <div style={{
                  border: '1.5px solid #dc2626', borderRadius: 4,
                  padding: '5px 40px', fontSize: 15, color: '#b91c1c',
                  fontFamily: 'Georgia, serif', fontWeight: 700,
                  letterSpacing: '0.18em', background: '#fff5f5',
                }}>
                  TRANSFER CERTIFICATE
                </div>
              </div>

              {/* ══ BARCODE ROW ══ */}
              <div style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                marginBottom: 10, paddingBottom: 8,
                borderBottom: '1px solid #e0e7ff',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <BarcodeImg value={admNo} height={36} />
                  <span style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 }}>
                    ADMISSION BARCODE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, fontSize: 12.5, color: '#374151', fontFamily: "'Times New Roman', Times, serif" }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#6b7280' }}>Certificate No.</span>
                    <span style={{
                      background: '#fef2f2', border: '1px solid #fca5a5',
                      color: '#b91c1c', fontWeight: 800, fontSize: 13.5,
                      padding: '2px 10px', borderRadius: 4, letterSpacing: '0.06em',
                    }}>{tcNo}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ color: '#6b7280' }}>Admission No.</span>
                    <U v={admNo} w={100} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ color: '#6b7280' }}>Issue Date</span>
                    <U v={today} w={100} />
                  </div>
                </div>
              </div>

              {/* ══ BODY ══ */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
                {bodyRows.map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-end', width: '100%',
                    gap: 4, lineHeight: 1.55,
                  }}>
                    {'before2' in row && row.before2 && <U v={String(row.before2)} w={row.before2w} />}
                    {row.before !== undefined && (
                      <span style={{
                        fontSize: '14pt', color: '#374151',
                        whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.55,
                        fontFamily: "'Times New Roman', Times, serif",
                      }}>
                        {row.before}
                      </span>
                    )}
                    {'after2' in row && row.after2 ? (
                      <>
                        <U v={row.val} w={row.w} grow={row.grow} />
                        <span style={{ fontSize: '14pt', color: '#374151', flexShrink: 0, lineHeight: 1.55, fontFamily: "'Times New Roman', Times, serif" }}>
                          {row.after2.prefix}
                        </span>
                        <U v={row.after2.val} grow={row.after2.grow} w={row.after2.w ?? 70} />
                      </>
                    ) : (
                      <U v={row.val} w={row.w} grow={row.grow} />
                    )}
                    {'after' in row && row.after && (
                      <span style={{ fontSize: '14pt', color: '#374151', flexShrink: 0, lineHeight: 1.55, fontFamily: "'Times New Roman', Times, serif" }}>
                        {row.after}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* ══ FOOTER ══ */}
              <div style={{ marginTop: 10, paddingTop: 12, borderTop: '2px dashed #c7d2fe' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: 16 }}>

                  {/* Left: signatures */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {[
                      { label: 'Prepared by', val: '' },
                      { label: 'Checked by', val: '' },
                      { label: 'Date of Issue', val: today },
                    ].map(({ label, val }, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-end', gap: 8,
                        fontSize: 14, color: '#374151', fontFamily: "'Times New Roman', Times, serif",
                      }}>
                        <span style={{ flexShrink: 0, color: '#6b7280', minWidth: 88 }}>{label}</span>
                        <span style={{
                          flex: 1, borderBottom: '1.5px solid #9ca3af', minWidth: 90,
                          display: 'inline-block', height: 22,
                        }}>
                          {val && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', paddingLeft: 4 }}>{val}</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Center: Seal */}
                  <div style={{
                    width: 110, height: 110, flexShrink: 0,
                    border: '2px dashed #9ca3af', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 3,
                  }}>
                    <span style={{ fontSize: 12, color: '#c4b5fd', fontFamily: 'Georgia, serif', textAlign: 'center', lineHeight: 1.5, letterSpacing: '0.08em' }}>
                      OFFICIAL<br />SEAL
                    </span>
                  </div>

                  {/* Right: QR + Principal */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{
                      border: '2px solid #c7d2fe', padding: 5, borderRadius: 8,
                      background: '#f5f3ff',
                    }}>
                      <QRCodeImg value={verifyUrl} size={96} />
                      <div style={{ textAlign: 'center', fontSize: 9, color: '#818cf8', marginTop: 4, letterSpacing: '0.06em', fontWeight: 600 }}>
                        SCAN TO VERIFY
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <div style={{ height: 34 }} />
                      <div style={{
                        borderTop: '2px solid #374151', paddingTop: 6,
                        fontSize: 14, fontWeight: 700, color: '#111827',
                        letterSpacing: '0.06em', fontFamily: "'Times New Roman', Times, serif",
                      }}>
                        Principal / Vice Principal
                      </div>
                    </div>
                  </div>

                </div>

                {/* ── Verify URL ── */}
                <div style={{
                  marginTop: 10, paddingTop: 7, borderTop: '1.5px solid #e0e7ff',
                  textAlign: 'center', fontSize: 10, color: '#9ca3af', letterSpacing: '0.04em',
                }}>
                  Verify this certificate at: <span style={{ color: '#6366f1', fontWeight: 600 }}>{verifyUrl}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
