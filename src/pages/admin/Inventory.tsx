import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useErpClasses, useSchoolInfo } from '../../hooks/useErpAcademics';
import {
  getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem,
  getInventorySales, createInventorySale, useErpStaff,
} from '../../hooks/useErpAcademics';
import { useStudents } from '../../hooks/useErpStudents';
import { supabase } from '../../lib/supabase';
import {
  Plus, Search, Edit2, Trash2, ShoppingCart, FileText,
  X, Check, AlertTriangle, Printer, RefreshCw, Archive
} from 'lucide-react';

/* ── types ─────────────────────────────────────────────────────── */
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  unit_price: number;
  stock_qty: number;
  sold_qty: number;
  class_id: string | null;
  session_id: string;
  erp_classes?: { name: string } | null;
}

interface SaleItem { item_id: string; name: string; qty: number; unit_price: number; total: number; }
interface Sale {
  id: string;
  invoice_number: string;
  student_id: string;
  items: SaleItem[];
  total_amount: number;
  payment_method: string;
  notes: string | null;
  collected_by?: string;
  created_at: string;
  erp_students?: { first_name: string; last_name: string; admission_number: string } | null;
}

const CATEGORIES = ['Book', 'Textbook', 'Stationery', 'Uniform', 'Equipment', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Online', 'Cheque', 'Card'];
const CAT_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  Book:       { bg: '#ede9fe', color: '#7c3aed', icon: '📚' },
  Textbook:   { bg: '#ffedd5', color: '#ea580c', icon: '📖' },
  Stationery: { bg: '#dbeafe', color: '#2563eb', icon: '✏️' },
  Uniform:    { bg: '#dcfce7', color: '#16a34a', icon: '👕' },
  Equipment:  { bg: '#fef3c7', color: '#d97706', icon: '🔧' },
  Other:      { bg: '#f1f5f9', color: '#64748b', icon: '📦' },
};

/* ── helper ─────────────────────────────────────────────────────── */
async function getSessions(schoolId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('erp-academics', {
    body: { method: 'getAcademicSessions', payload: { school_id: schoolId } },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export default function Inventory({ noLayout = false }: { noLayout?: boolean }) {
  const { schoolId, profile } = useAuth();
  const { classes } = useErpClasses(schoolId);
  const { students } = useStudents(schoolId);
  const { staff } = useErpStaff(schoolId);
  const { school } = useSchoolInfo(schoolId);

  /* sessions */
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState('');

  /* items */
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  /* UI state */
  const [tab, setTab] = useState<'items' | 'sales'>('items');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  /* item modal */
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', category: 'Book', description: '', unit_price: '', stock_qty: '', class_id: '' });
  const [saving, setSaving] = useState(false);

  /* sale modal */
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleStudent, setSaleStudent] = useState('');
  const [saleStudentSearch, setSaleStudentSearch] = useState('');
  const [saleClassFilter, setSaleClassFilter] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [lastAutoFilledStudent, setLastAutoFilledStudent] = useState('');
  const [salePayment, setSalePayment] = useState('Cash');
  const [saleNotes, setSaleNotes] = useState('');
  const [saleProcessing, setSaleProcessing] = useState(false);

  /* invoice modal */
  const [viewInvoice, setViewInvoice] = useState<Sale | null>(null);

  /* delete modal */
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Load sessions ── */
  useEffect(() => {
    if (!schoolId) return;
    getSessions(schoolId).then(sess => {
      setSessions(sess);
      const cur = sess.find((s: any) => s.is_current) ?? sess[0];
      if (cur) setSessionId(cur.id);
    });
  }, [schoolId]);

  /* ── Load inventory data ── */
  const loadData = useCallback(async () => {
    if (!schoolId || !sessionId) return;
    setLoading(true);
    try {
      const [inv, sal] = await Promise.all([
        getInventoryItems({ school_id: schoolId, session_id: sessionId }),
        getInventorySales({ school_id: schoolId, session_id: sessionId }),
      ]);
      setItems(Array.isArray(inv) ? inv : []);
      setSales(Array.isArray(sal) ? sal : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [schoolId, sessionId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── filtered items ── */
  const filteredItems = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || i.category === catFilter;
    const matchClass = !classFilter || i.class_id === classFilter;
    return matchSearch && matchCat && matchClass;
  });

  const staffProfileMap = useMemo(() => {
    const m = new Map<string, string>();
    staff.forEach((s: any) => { if (s.profile_id) m.set(s.profile_id as string, (s.profiles as any)?.full_name || 'Staff'); });
    return m;
  }, [staff]);

  const filteredSales = sales.filter(s => {
    const name = `${s.erp_students?.first_name} ${s.erp_students?.last_name}`.toLowerCase();
    return !search || name.includes(search.toLowerCase()) || s.invoice_number.toLowerCase().includes(search.toLowerCase());
  });

  /* ── Stats ── */
  const totalRevenue = sales.reduce((a, s) => a + (s.total_amount || 0), 0);
  const totalSold = items.reduce((a, i) => a + i.sold_qty, 0);
  const lowStock = items.filter(i => (i.stock_qty - i.sold_qty) <= 5 && (i.stock_qty - i.sold_qty) >= 0).length;

  /* ── Item CRUD ── */
  function openAddItem() {
    setEditItem(null);
    setItemForm({ name: '', category: 'Book', description: '', unit_price: '', stock_qty: '', class_id: '' });
    setShowItemModal(true);
  }
  function openEditItem(item: InventoryItem) {
    setEditItem(item);
    setItemForm({
      name: item.name, category: item.category,
      description: item.description || '', unit_price: String(item.unit_price),
      stock_qty: String(item.stock_qty), class_id: item.class_id || '',
    });
    setShowItemModal(true);
  }
  async function handleSaveItem() {
    if (!schoolId || !sessionId || !itemForm.name) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateInventoryItem({
          school_id: schoolId, id: editItem.id,
          name: itemForm.name, category: itemForm.category,
          description: itemForm.description,
          unit_price: parseFloat(itemForm.unit_price) || 0,
          stock_qty: parseInt(itemForm.stock_qty) || 0,
          class_id: itemForm.class_id || null,
        });
      } else {
        await createInventoryItem({
          school_id: schoolId, session_id: sessionId,
          name: itemForm.name, category: itemForm.category,
          description: itemForm.description,
          unit_price: parseFloat(itemForm.unit_price) || 0,
          stock_qty: parseInt(itemForm.stock_qty) || 0,
          class_id: itemForm.class_id || null,
        });
      }
      setShowItemModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function handleDeleteItem() {
    if (!deleteItem || !schoolId) return;
    setDeleting(true);
    try {
      await deleteInventoryItem({ school_id: schoolId, id: deleteItem.id });
      setDeleteItem(null);
      loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  }

  /* ── Sale ── */
  function openSaleModal() {
    setSaleStudent(''); setSaleStudentSearch(''); setSaleClassFilter(''); setLastAutoFilledStudent(''); setSaleItems([]); setSalePayment('Cash'); setSaleNotes('');
    setShowSaleModal(true);
  }

  // Auto-populate cart with student's class items + general items
  useEffect(() => {
    if (saleStudent && saleStudent !== lastAutoFilledStudent) {
      const defaults = items
        .filter(i => (i.stock_qty - i.sold_qty) > 0)
        .map(i => ({ item_id: i.id, name: i.name, qty: 1, unit_price: i.unit_price, total: i.unit_price }));
      setSaleItems(defaults);
      setLastAutoFilledStudent(saleStudent);
    } else if (!saleStudent && lastAutoFilledStudent) {
      setSaleItems([]);
      setLastAutoFilledStudent('');
    }
  }, [saleStudent, lastAutoFilledStudent, students, items]);

  const saleTotal = saleItems.reduce((a, i) => a + i.total, 0);
  async function handleCreateSale() {
    if (!schoolId || !sessionId || !saleStudent || saleItems.length === 0) return;
    setSaleProcessing(true);
    try {
      const result = await createInventorySale({
        school_id: schoolId, session_id: sessionId, student_id: saleStudent,
        items: saleItems, total_amount: saleTotal,
        payment_method: salePayment, notes: saleNotes,
      });
      setShowSaleModal(false);
      loadData();
      // Open the invoice
      if (result) setViewInvoice(result as Sale);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaleProcessing(false);
    }
  }



  /* ─────────────────── RENDER ─────────────────────────── */
  const content = (
    <>
      <div style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>

        {/* ── Session selector ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '7px 14px' }}>
            <Archive size={15} color="#7c3aed" />
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Session:</span>
            <select value={sessionId} onChange={e => setSessionId(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: '#1e293b', background: 'none', cursor: 'pointer' }}>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button onClick={loadData} style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button onClick={openSaleModal} style={{ background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
              <ShoppingCart size={15} /> New Sale
            </button>
            <button onClick={openAddItem} style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
              <Plus size={15} /> Add Item
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Items', value: items.length, icon: '📦', color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Units Sold', value: totalSold, icon: '🛒', color: '#2563eb', bg: '#dbeafe' },
            { label: 'Low Stock', value: lowStock, icon: '⚠️', color: '#d97706', bg: '#fef3c7' },
          ].map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
                <span style={{ fontSize: 22 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {['items', 'sales'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} style={{
              padding: '7px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: tab === t ? '#fff' : 'none',
              color: tab === t ? '#7c3aed' : '#64748b',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              textTransform: 'capitalize',
            }}>{t === 'items' ? '📦 Inventory Items' : '🧾 Sales & Invoices'}</button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'items' ? 'Search items...' : 'Search student or invoice...'} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#475569', background: 'none', width: '100%' }} />
          </div>
          {tab === 'items' && <>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#475569', background: '#fff', outline: 'none', cursor: 'pointer' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#475569', background: '#fff', outline: 'none', cursor: 'pointer' }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </>}
        </div>

        {/* ── Items Table ── */}
        {tab === 'items' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading inventory...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>No items found</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Add books, stationery or other items for this session</div>
                <button onClick={openAddItem} style={{ marginTop: 16, background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add First Item</button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Item Name', 'Category', 'Class', 'Unit Price', 'Stock', 'Sold', 'Available', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => {
                      const cat = CAT_COLORS[item.category] || CAT_COLORS.Other;
                      const avail = item.stock_qty - item.sold_qty;
                      return (
                        <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '13px 20px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.description}</div>}
                          </td>
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ background: cat.bg, color: cat.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{cat.icon} {item.category}</span>
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#64748b' }}>{item.erp_classes?.name || '—'}</td>
                          <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>₹{Number(item.unit_price).toFixed(2)}</td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{item.stock_qty}</td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#64748b' }}>{item.sold_qty}</td>
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ background: avail <= 5 ? '#fee2e2' : avail <= 15 ? '#fef9c3' : '#dcfce7', color: avail <= 5 ? '#dc2626' : avail <= 15 ? '#ca8a04' : '#16a34a', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                              {avail <= 5 && <AlertTriangle size={10} style={{ marginRight: 4, display: 'inline' }} />}{avail}
                            </span>
                          </td>
                          <td style={{ padding: '13px 20px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => openEditItem(item)} style={{ background: '#ede9fe', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7c3aed', fontWeight: 600, fontFamily: 'inherit' }}>
                                <Edit2 size={12} /> Edit
                              </button>
                              <button onClick={() => setDeleteItem(item)} style={{ background: '#fee2e2', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#dc2626', fontWeight: 600, fontFamily: 'inherit' }}>
                                <Trash2 size={12} /> Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Sales Table ── */}
        {tab === 'sales' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading sales...</div>
            ) : filteredSales.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>No sales recorded</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Create a sale to generate invoices for students</div>
                <button onClick={openSaleModal} style={{ marginTop: 16, background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ New Sale</button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Invoice #', 'Student', 'Admission No', 'Items', 'Total', 'Payment', 'Date', 'Sold By', 'Action'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map(sale => (
                      <tr key={sale.id} style={{ borderTop: '1px solid #f1f5f9' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>{sale.invoice_number}</td>
                        <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                          {sale.erp_students ? `${sale.erp_students.first_name} ${sale.erp_students.last_name}` : '—'}
                        </td>
                        <td style={{ padding: '13px 20px', fontSize: 13, color: '#64748b' }}>{sale.erp_students?.admission_number || '—'}</td>
                        <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{Array.isArray(sale.items) ? sale.items.length : 0} item(s)</td>
                        <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>₹{Number(sale.total_amount).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '13px 20px' }}>
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>{sale.payment_method}</span>
                        </td>
                        <td style={{ padding: '13px 20px', fontSize: 12, color: '#94a3b8' }}>
                          {new Date(sale.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '13px 20px', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                          {sale.collected_by ? (staffProfileMap.get(sale.collected_by) || 'Admin') : 'Admin'}
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <button onClick={() => setViewInvoice(sale)} style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FileText size={12} /> Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════ ADD/EDIT ITEM MODAL ════════════════ */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowItemModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>{editItem ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <button onClick={() => setShowItemModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748b" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lblStyle}>Item Name *</label>
                <input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Mathematics Textbook" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lblStyle}>Category *</label>
                  <select value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Class (Optional)</label>
                  <select value={itemForm.class_id} onChange={e => setItemForm(f => ({ ...f, class_id: e.target.value }))} style={inputStyle}>
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lblStyle}>Unit Price (₹) *</label>
                  <input type="number" min="0" value={itemForm.unit_price} onChange={e => setItemForm(f => ({ ...f, unit_price: e.target.value }))} style={inputStyle} placeholder="0.00" />
                </div>
                <div>
                  <label style={lblStyle}>Stock Quantity *</label>
                  <input type="number" min="0" value={itemForm.stock_qty} onChange={e => setItemForm(f => ({ ...f, stock_qty: e.target.value }))} style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div>
                <label style={lblStyle}>Description (Optional)</label>
                <input value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="Add a short description..." />
              </div>
              <button onClick={handleSaveItem} disabled={saving || !itemForm.name} style={{ background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editItem ? '✓ Update Item' : '+ Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ DELETE CONFIRMATION MODAL ════════════════ */}
      {deleteItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeleteItem(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1px solid #fee2e2', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#fee2e2', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#dc2626' }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Confirm Deletion</h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 24px' }}>
              Are you sure you want to delete <strong style={{ color: '#0f172a' }}>"{deleteItem.name}"</strong>? This will permanently remove it from the session inventory. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleteItem(null)} disabled={deleting} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleDeleteItem} disabled={deleting} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {deleting ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" /> Deleting…
                  </>
                ) : (
                  'Delete Item'
                )}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .spin-icon {
              animation: spin 1s linear infinite;
            }
          `}</style>
        </div>
      )}

      {/* ════════════════ NEW SALE MODAL ════════════════ */}
      {showSaleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowSaleModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>🛒 New Sale / Invoice</h2>
              <button onClick={() => setShowSaleModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748b" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Student Selection with Search/Filter */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Select Student *</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 150 }}>
                     <Search size={14} color="#94a3b8" />
                     <input value={saleStudentSearch} onChange={e => setSaleStudentSearch(e.target.value)} placeholder="Search name or ID..." style={{ border: 'none', outline: 'none', fontSize: 13, color: '#475569', background: 'none', width: '100%' }} />
                   </div>
                   <select value={saleClassFilter} onChange={e => setSaleClassFilter(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#475569', background: '#fff', outline: 'none', cursor: 'pointer', maxWidth: 150 }}>
                     <option value="">All Classes</option>
                     {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                {/* Interactive Dynamic Student List */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, maxHeight: 185, overflowY: 'auto', marginTop: 10, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                  {(() => {
                    const matched = students.filter((s: any) => {
                      const matchSearch = !saleStudentSearch || `${s.first_name} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(saleStudentSearch.toLowerCase());
                      const matchClass = !saleClassFilter || s.current_class_id === saleClassFilter;
                      return matchSearch && matchClass;
                    });

                    if (matched.length === 0) {
                      return (
                        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                          🔍 No matching students found
                        </div>
                      );
                    }

                    return matched.map((s: any) => {
                      const isSelected = saleStudent === s.id;
                      const className = s.erp_classes?.name || classes.find(c => c.id === s.current_class_id)?.name || 'Unassigned';
                      const secPart = s.current_section ? ` | Sec: ${s.current_section}` : '';
                      const rollPart = s.roll_number ? ` | Roll: ${s.roll_number}` : '';
                      const initials = `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase();

                      return (
                        <div key={s.id} onClick={() => setSaleStudent(isSelected ? '' : s.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            background: isSelected ? '#f5f3ff' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Initials Badge */}
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: isSelected ? '#c084fc' : '#e2e8f0',
                              color: isSelected ? '#fff' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 800
                            }}>
                              {initials || 'ST'}
                            </div>
                            
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#7c3aed' : '#1e293b' }}>
                                {s.first_name} {s.last_name}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                                <span style={{ color: '#7c3aed', fontWeight: 600 }}>{s.admission_number}</span> — {className}{secPart}{rollPart}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <div style={{ background: '#7c3aed', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              {/* Add Items */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Select Items</div>
                
                {/* Recommended and Additional Checkboxes */}
                {saleStudent && (() => {
                  const student = students.find((s: any) => s.id === saleStudent);
                  const sClass = student?.current_class_id;
                  
                  const recommended = items.filter(i => (i.stock_qty - i.sold_qty) > 0 && (!i.class_id || i.class_id === sClass));
                  const additional = items.filter(i => (i.stock_qty - i.sold_qty) > 0 && i.class_id && i.class_id !== sClass);
                  
                  const renderChecklist = (list: any[], title: string) => {
                    if (list.length === 0) return null;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{title}</div>
                        {list.map(item => {
                          const isSelected = saleItems.some(s => s.item_id === item.id);
                          return (
                            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSaleItems(prev => [...prev, { item_id: item.id, name: item.name, qty: 1, unit_price: item.unit_price, total: item.unit_price }]);
                                  } else {
                                    setSaleItems(prev => prev.filter(s => s.item_id !== item.id));
                                  }
                                }}
                                style={{ width: 16, height: 16, accentColor: '#7c3aed' }} 
                              />
                              <div style={{ flex: 1, fontSize: 13, color: isSelected ? '#1e293b' : '#64748b', fontWeight: isSelected ? 600 : 500 }}>{item.name}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#7c3aed' : '#94a3b8' }}>₹{item.unit_price}</div>
                            </label>
                          );
                        })}
                      </div>
                    );
                  };

                  return (
                    <>
                      {renderChecklist(recommended, 'Recommended Set')}
                      {renderChecklist(additional, 'Additional Items')}
                    </>
                  );
                })()}
              </div>
              {/* Cart */}
              {saleItems.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cart</div>
                  {saleItems.map((si, idx) => (
                    <div key={si.item_id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{si.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>₹{si.unit_price} × {si.qty}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>₹{si.total.toLocaleString('en-IN')}</div>
                      <button onClick={() => setSaleItems(prev => prev.filter(x => x.item_id !== si.item_id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><X size={14} /></button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Total</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>₹{saleTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              {/* Payment & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lblStyle}>Payment Method</label>
                  <select value={salePayment} onChange={e => setSalePayment(e.target.value)} style={inputStyle}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Notes (Optional)</label>
                  <input value={saleNotes} onChange={e => setSaleNotes(e.target.value)} style={inputStyle} placeholder="Any notes..." />
                </div>
              </div>
              <button onClick={handleCreateSale} disabled={saleProcessing || !saleStudent || saleItems.length === 0}
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: (saleProcessing || !saleStudent || saleItems.length === 0) ? 0.6 : 1 }}>
                {saleProcessing ? 'Processing…' : '✓ Confirm Sale & Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ INVOICE MODAL ════════════════ */}
      {viewInvoice && (() => {
        const invoiceStudent = students.find((s: any) => s.id === viewInvoice.student_id);
        const qrData = encodeURIComponent(`INV:${viewInvoice.invoice_number}|STU:${viewInvoice.erp_students?.admission_number || ''}|AMT:${viewInvoice.total_amount}`);
        const currentSession = sessions.find((s: any) => s.id === sessionId);
        
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewInvoice(null)}>
            <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', maxHeight: '95vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
              
              {/* No-print Modal Header */}
              <div className="no-print" style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>🧾 View & Print Invoice</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Printer size={14} /> Print
                  </button>
                  <button onClick={() => setViewInvoice(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex', color: '#64748b' }}><X size={16} /></button>
                </div>
              </div>

              {/* Printable area container */}
              <div className="print-area" style={{ padding: 32, overflowY: 'auto', background: '#fff' }}>
                
                {/* ─── SCHOOL HEADER (STUNNING PREMIUM DESIGN) ─── */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', borderBottom: '3px double #e2e8f0', paddingBottom: 20, marginBottom: 20 }}>
                  {/* Logo Container */}
                  <div style={{ width: 70, height: 70, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {school?.logo_url ? (
                      <img src={school.logo_url} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ fontSize: 28 }}>🏫</div>
                    )}
                  </div>
                  
                  {/* School Text Details */}
                  <div style={{ flex: 1 }}>
                    <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                      {school?.name || 'School ERP'}
                    </h1>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                      {school?.address && <span>{school.address}</span>}
                      {(school?.city || school?.state) && (
                        <span>
                          {school.address ? ', ' : ''}
                          {[school.city, school.state, school.postal_code].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4, fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                      {school?.contact_phone && <span>📞 {school.contact_phone}</span>}
                      {school?.website && <span>🌐 {school.website}</span>}
                      {school?.affiliation_number && <span>Affiliation No: {school.affiliation_number}</span>}
                    </div>
                  </div>
                </div>

                {/* ─── INVOICE BANNER & META ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, width: 'fit-content', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      INVENTORY INVOICE
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{viewInvoice.invoice_number}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                    <div><strong style={{ color: '#1e293b' }}>Date:</strong> {new Date(viewInvoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div style={{ marginTop: 2 }}><strong style={{ color: '#1e293b' }}>Session:</strong> {currentSession?.name || '—'}</div>
                  </div>
                </div>

                {/* ─── STUDENT INFO ("BILL TO") & QR ─── */}
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Bill To</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                      {viewInvoice.erp_students ? `${viewInvoice.erp_students.first_name} ${viewInvoice.erp_students.last_name}` : 'Student'}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px 12px' }}>
                      <span><strong style={{ color: '#94a3b8', fontWeight: 600 }}>Adm No:</strong> {viewInvoice.erp_students?.admission_number || '—'}</span>
                      {invoiceStudent && (
                        <>
                          {invoiceStudent.erp_classes?.name && <span><strong style={{ color: '#94a3b8', fontWeight: 600 }}>Class:</strong> {invoiceStudent.erp_classes.name}</span>}
                          {invoiceStudent.current_section && <span><strong style={{ color: '#94a3b8', fontWeight: 600 }}>Section:</strong> {invoiceStudent.current_section}</span>}
                          {invoiceStudent.roll_number && <span><strong style={{ color: '#94a3b8', fontWeight: 600 }}>Roll No:</strong> {invoiceStudent.roll_number}</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: 6, borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0, marginLeft: 16 }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${qrData}`} width={60} height={60} alt="QR Code" style={{ display: 'block' }} />
                  </div>
                </div>

                {/* ─── ITEMS TABLE ─── */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>Item Description</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right', width: 60 }}>Qty</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right', width: 100 }}>Unit Price</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right', width: 100 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(viewInvoice.items) ? viewInvoice.items : []).map((item: SaleItem, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#475569', textAlign: 'right' }}>{item.qty}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#475569', textAlign: 'right' }}>₹{Number(item.unit_price).toFixed(2)}</td>
                        <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>₹{Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* ─── SUMMARY BLOCK & PAYMENT INFO ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    <div style={{ marginBottom: 4 }}><strong style={{ color: '#475569' }}>Payment Mode:</strong> <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontWeight: 600, fontSize: 11 }}>{viewInvoice.payment_method}</span></div>
                    {viewInvoice.notes && <div><strong style={{ color: '#475569' }}>Note:</strong> {viewInvoice.notes}</div>}
                  </div>
                  
                  <div style={{ width: '100%', maxWidth: 240 }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Total Paid</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>₹{Number(viewInvoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* ─── FOOTER & SIGNATURES ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 20, color: '#94a3b8', fontSize: 11 }}>
                  <span>Thank you for your purchase!<br />This is a computer-generated invoice.</span>
                  <div style={{ textAlign: 'right', minWidth: 150 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, marginBottom: 4 }}>
                      {viewInvoice.collected_by ? (staffProfileMap.get(viewInvoice.collected_by) || 'Admin') : (profile?.full_name || 'Admin')}
                    </div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 4, color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Authorized Signature
                    </div>
                  </div>
                </div>

              </div>

              {/* No-print Modal Footer */}
              <div className="no-print" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#fff', gap: 12 }}>
                <button onClick={() => setViewInvoice(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
                  Close
                </button>
              </div>

            </div>

            <style>{`
              @media print {
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100%; 
                  padding: 10px !important;
                }
                .no-print { display: none !important; }
              }
            `}</style>
          </div>
        );
      })()}
    </>
  );

  if (noLayout) {
    return content;
  }

  return (
    <AdminLayout pageTitle="Inventory" pageSubtitle="Manage books, stationery & other items per session">
      {content}
    </AdminLayout>
  );
}

const lblStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' };
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: 13, fontFamily: 'Outfit, system-ui, sans-serif', color: '#1e293b', outline: 'none', background: '#fff', boxSizing: 'border-box' };
