import { X, Printer, FileText } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    plan: string;
    amount: number;
    razorpay_payment_id?: string;
    created_at?: string;
    expires_at?: string;
    status?: string;
    coupon_code?: string;
    original_amount?: number;
    discount_amount?: number;
  };
  school: {
    name?: string | null;
    admin_email?: string | null;
    contact_phone?: string | null;
    school_code?: string | null;
    address?: string | null;
  } | null;
}

export default function InvoiceModal({ isOpen, onClose, payment, school }: InvoiceModalProps) {
  if (!isOpen) return null;

  const totalPaid = Number(payment.amount || 0);
  const discountAmountTotal = Number(payment.discount_amount || 0);
  const hasCoupon = !!payment.coupon_code && discountAmountTotal > 0;

  // Invoice back-calculations
  // Total T = S_net + F + G
  // Where F = S_net * 0.02, G = 0.18 * (S_net + F) = 0.1836 * S_net
  // Total T = S_net * 1.2036 => S_net = T / 1.2036
  const netSubtotal = Number((totalPaid / 1.2036).toFixed(2));
  const processingFee = Number((netSubtotal * 0.02).toFixed(2));
  const gst = Number((totalPaid - netSubtotal - processingFee).toFixed(2));

  // Original subtotal before discount (base rate)
  const discountSubtotal = Number((discountAmountTotal / 1.2036).toFixed(2));
  const originalSubtotal = hasCoupon ? Number((netSubtotal + discountSubtotal).toFixed(2)) : netSubtotal;

  const formattedDate = payment.created_at
    ? new Date(payment.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const expiresDate = payment.expires_at
    ? new Date(payment.expires_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const invoiceNumber = `LBNV10-${payment.id?.slice(0, 8).toUpperCase() || 'TX'}`;

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-area');
    if (!printContent) return;

    // Open a new window for clean print formatting
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print/download invoice.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-card {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 24px;
              margin-bottom: 24px;
            }
            .logo-title {
              font-size: 24px;
              font-weight: 800;
              color: #1e293b;
            }
            .logo-accent {
              color: #7c3aed;
            }
            .meta-info {
              text-align: right;
            }
            .meta-info h2 {
              margin: 0 0 6px;
              font-size: 20px;
              color: #7c3aed;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .meta-info p {
              margin: 2px 0;
              font-size: 13px;
              color: #64748b;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 30px;
            }
            .details-block h4 {
              margin: 0 0 8px;
              font-size: 12px;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .details-block p {
              margin: 4px 0;
              font-size: 14px;
              line-height: 1.5;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .table th {
              background: #f8fafc;
              text-align: left;
              padding: 12px 16px;
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 2px solid #e2e8f0;
            }
            .table td {
              padding: 16px;
              font-size: 13px;
              border-bottom: 1px solid #f1f5f9;
              color: #334155;
            }
            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-table {
              width: 320px;
              border-collapse: collapse;
            }
            .summary-table td {
              padding: 8px 16px;
              font-size: 13px;
              color: #64748b;
            }
            .summary-table tr.total-row td {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              border-top: 2px solid #e2e8f0;
              padding-top: 12px;
            }
            .badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              background: #ecfdf5;
              color: #059669;
              border: 1px solid #a7f3d0;
              text-transform: capitalize;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="invoice-card">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15,23,42,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
        fontFamily: 'Outfit, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          width: '100%',
          maxWidth: 780,
          maxHeight: 'calc(100vh - 40px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes modalSlideIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @media print {
            .no-print { display: none !important; }
          }
        `}} />

        {/* Modal Header Actions (Non-Printable) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#7c3aed" />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
              Invoice Preview
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(124, 58, 237, 0.2)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#6d28d9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#7c3aed')}
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                padding: 8,
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Printable Invoice Area */}
        <div
          style={{
            padding: '32px 40px',
            overflowY: 'auto',
            flex: 1,
            background: '#fff',
          }}
        >
          <div id="invoice-print-area">
            {/* Header / Brand */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: 24, marginBottom: 24 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
                  Learn<span style={{ color: '#7c3aed' }}>Bee</span> ERP
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                  LearnBee ERP<br />
                  Diphu, Karbi Anglong, Assam<br />
                  India 782460
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  TAX INVOICE
                </h2>
                <p style={{ margin: '6px 0 2px', fontSize: 13, color: '#1e293b', fontWeight: 600 }}>
                  Invoice: <span style={{ fontFamily: 'monospace' }}>{invoiceNumber}</span>
                </p>
                <p style={{ margin: '2px 0', fontSize: 12, color: '#64748b' }}>
                  Date: {formattedDate}
                </p>
                <p style={{ margin: '4px 0 0' }}>
                  <span className="badge" style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0'
                  }}>Paid</span>
                </p>
              </div>
            </div>

            {/* Billing details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 30 }}>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  BILLED TO
                </h4>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                  {school?.name || 'LearnBee Partner School'}
                </p>
                <p style={{ margin: '2px 0', fontSize: 13, color: '#475569' }}>
                  School Code: {school?.school_code || '—'}
                </p>
                <p style={{ margin: '2px 0', fontSize: 13, color: '#475569', maxWidth: 300, lineHeight: 1.4 }}>
                  {school?.address || 'Address not configured.'}
                </p>
                <p style={{ margin: '2px 0', fontSize: 13, color: '#475569' }}>
                  Email: {school?.admin_email || '—'}
                </p>
                <p style={{ margin: '2px 0', fontSize: 13, color: '#475569' }}>
                  Phone: {school?.contact_phone || '—'}
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PAYMENT METADATA
                </h4>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#475569' }}>
                  <strong>Gateway:</strong> Razorpay Online Payment
                </p>
                <p style={{ margin: '2px 0', fontSize: 13, color: '#475569' }}>
                  <strong>Payment ID:</strong> <span style={{ fontFamily: 'monospace' }}>{payment.razorpay_payment_id || '—'}</span>
                </p>
                <p style={{ margin: '2px 0', fontSize: 13, color: '#475569' }}>
                  <strong>Subscription plan:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{payment.plan}</span>
                </p>
                <p style={{ margin: '2px 0', fontSize: 13, color: '#475569' }}>
                  <strong>Active Session Period:</strong> {formattedDate.split(',')[0]} to {expiresDate}
                </p>
              </div>
            </div>

            {/* Bill Description Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', width: 140 }}>Base Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '16px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      LearnBee ERP Subscription - <span style={{ textTransform: 'capitalize' }}>{payment.plan}</span> Plan
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      Monthly billing cycle setup with multi-tenant dashboard access, database sync, and staff/student gating configurations.
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#334155', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                    ₹{originalSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {hasCoupon && (
                  <tr>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#059669', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🎫 Coupon Applied:</span>
                        <span style={{ fontFamily: 'monospace', background: '#d1fae5', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{payment.coupon_code}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                        Platform loyalty discount code successfully applied at checkout.
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#059669', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                      -₹{discountSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Calculations breakdown block */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <table style={{ width: 340, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#64748b' }}>Net Subtotal:</td>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#334155', textAlign: 'right', fontWeight: 500 }}>
                      ₹{netSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Processing Fee (2.0%):
                    </td>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#334155', textAlign: 'right', fontWeight: 500 }}>
                      ₹{processingFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#64748b' }}>CGST + SGST (18.0%):</td>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#334155', textAlign: 'right', fontWeight: 500 }}>
                      ₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="total-row">
                    <td style={{ padding: '12px 16px', fontSize: 15, fontWeight: 800, color: '#0f172a', borderTop: '2px solid #e2e8f0' }}>Total Paid Amount:</td>
                    <td style={{ padding: '12px 16px', fontSize: 17, fontWeight: 800, color: '#7c3aed', textAlign: 'right', borderTop: '2px solid #e2e8f0' }}>
                      ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note/Terms */}
            <div style={{ marginTop: 50, borderTop: '1px solid #e2e8f0', paddingTop: 20, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                Thank you for your business! This invoice is computer generated and does not require a physical signature.<br />
                For any queries regarding this receipt, please contact support@learnbee.in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
