import AdminLayout from '../../../components/AdminLayout';
import { Bus } from 'lucide-react';

const routes = [
  { route: 'Route A – Koramangala', students: 12, amount: 2500, collected: 25000 },
  { route: 'Route B – Indiranagar',  students: 8,  amount: 2800, collected: 16800 },
  { route: 'Route C – Whitefield',   students: 15, amount: 3200, collected: 41600 },
];

export default function TransportFees() {
  return (
    <AdminLayout pageTitle="Transport Fees" pageSubtitle="Manage school transport fee collection">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Students', value: '35',        color: '#7c3aed', icon: '🚌' },
          { label: 'Total Collected', value: '₹83,400', color: '#16a34a', icon: '✅' },
          { label: 'Active Routes',   value: '3',        color: '#0891b2', icon: '🗺️' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 24 }}>{c.icon}</span>
            <div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600 }}>{c.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: c.color, margin: '2px 0 0' }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bus size={16} color="#7c3aed" />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Transport Routes & Fees</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Route', 'Students', 'Fee/Student', 'Total Collected', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.route} style={{ borderTop: '1px solid #f1f5f9' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🚌</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{r.route}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{r.students} students</td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>₹{r.amount.toLocaleString()}</td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>₹{r.collected.toLocaleString()}</td>
                <td style={{ padding: '13px 16px' }}>
                  <button style={{ padding: '5px 12px', background: '#ede9fe', border: 'none', borderRadius: 7, fontSize: 12, color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
