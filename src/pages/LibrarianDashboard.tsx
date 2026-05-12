import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Book, Hash, User, MapPin, IndianRupee, LogOut, LayoutDashboard, BookOpen, FileText, ChevronDown, Package, Search, Plus, X, Trash2, Barcode, Printer, ShoppingBag } from 'lucide-react';
import _QRCode from "react-qr-code";
const QRCode = (_QRCode as any).default || _QRCode;
import { useErpClasses, useSchoolInfo, useLibraryBooks, useLibraryIssues, useErpNotices, createLibraryBook, updateLibraryBook, deleteLibraryBook, issueLibraryBook, returnLibraryBook, useErpStaff, type ErpLibraryBook } from '../hooks/useErpAcademics';
import { useStudents } from '../hooks/useErpStudents';
import ProtectedRoute from '../components/ProtectedRoute';
import learnBeeLogo from '../assets/learnbeelogo.png';

type Tab = 'dashboard' | 'books' | 'notices' | 'issued';
const ACCENT = '#10b981';

export default function LibrarianDashboard() {
  const { profile, user, signOut, schoolId } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  const { school } = useSchoolInfo(schoolId);
  const { currentSession } = useErpClasses(schoolId);
  const { books, loading: booksLoading, refetch: refetchBooks } = useLibraryBooks(schoolId, currentSession?.id);
  const { issues, loading: issuesLoading, error: issuesError, refetch: refetchIssues } = useLibraryIssues(schoolId);
  const { students } = useStudents(schoolId);
  const { staff } = useErpStaff(schoolId);
  const { notices, loading: noticesLoading } = useErpNotices(schoolId);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ErpLibraryBook | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  const [newBook, setNewBook] = useState<any>({
    book_number: '', title: '', author: '', publisher: '', edition: '', isbn: '', category: 'General', rack_number: '', price: '', description: '', total_stock: '1'
  });
  const [isbnScan, setIsbnScan] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const fetchBookDetails = async (isbn: string) => {
    if (!isbn || isbn.length < 10) return;
    setIsFetching(true);
    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      const data = await res.json();
      const bookData = data[`ISBN:${isbn}`];
      if (bookData) {
        setNewBook((prev: any) => ({
          ...prev,
          title: bookData.title || prev.title,
          author: bookData.authors?.[0]?.name || prev.author,
          publisher: bookData.publishers?.[0]?.name || prev.publisher,
          isbn: isbn,
          book_number: prev.book_number || isbn
        }));
      } else {
        setNewBook((prev: any) => ({ ...prev, isbn: isbn }));
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsFetching(false);
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBook, setEditingBook] = useState<ErpLibraryBook | null>(null);
  const [deletingBook, setDeletingBook] = useState<ErpLibraryBook | null>(null);

  const [issueData, setIssueData] = useState({
    borrowerType: 'student' as 'student' | 'staff',
    studentId: '',
    staffId: '',
    studentName: '',
    staffName: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: ''
  });

  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [returnData, setReturnData] = useState({ fineAmount: '0', remarks: '' });

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = (profile?.full_name || 'L').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  const totalBooks = books.reduce((acc, b) => acc + (Number(b.total_stock) || 0), 0);
  const issuedBooks = issues.filter((iss: any) => iss.status === 'issued').length;
  const availableBooks = totalBooks - issuedBooks;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = issues.filter((iss: any) => {
    if (iss.status !== 'issued') return false;
    const dueDate = new Date(iss.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;
  
  const filtered = books.filter(b => !searchQ || b.title?.toLowerCase().includes(searchQ.toLowerCase()) || b.book_number?.toLowerCase().includes(searchQ.toLowerCase()));
  const filteredIssues = issues.filter((iss: any) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    const bookMatch = iss.erp_library_books?.title?.toLowerCase().includes(q) || 
                     iss.erp_library_books?.book_number?.toLowerCase().includes(q);
    const studentMatch = iss.erp_students?.first_name?.toLowerCase().includes(q) || 
                        iss.erp_students?.last_name?.toLowerCase().includes(q) || 
                        iss.erp_students?.admission_number?.toLowerCase().includes(q);
    const staffMatch = iss.staff?.profiles?.full_name?.toLowerCase().includes(q);
    return bookMatch || studentMatch || staffMatch;
  });

  // Search logic for borrowers
  const matchingBorrowers = issueData.borrowerType === 'student' 
    ? students.filter(s => borrowerSearch && (
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(borrowerSearch.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(borrowerSearch.toLowerCase())
      )).slice(0, 5)
    : staff.filter(s => borrowerSearch && (
        s.profiles?.full_name?.toLowerCase().includes(borrowerSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(borrowerSearch.toLowerCase())
      )).slice(0, 5);

  const matchingBooks = books.filter(b => bookSearch && (
    b.title?.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.book_number?.toLowerCase().includes(bookSearch.toLowerCase())
  ) && ((b.total_stock || 1) - (b.issued_qty || 0) > 0)).slice(0, 5);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !currentSession?.id) return;
    setSaving(true);
    try {
      await createLibraryBook({
        ...newBook,
        school_id: schoolId,
        session_id: currentSession.id,
        price: parseFloat(newBook.price) || 0,
        total_stock: parseInt(newBook.total_stock) || 1
      });
      setShowAddModal(false);
      setNewBook({ book_number: '', title: '', author: '', publisher: '', edition: '', isbn: '', category: 'General', rack_number: '', price: '', description: '', total_stock: '1' });
      refetchBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to add book');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !editingBook) return;
    setSaving(true);
    try {
      const { id, ...updateData } = editingBook;
      await updateLibraryBook({
        ...updateData,
        id,
        school_id: schoolId,
        price: parseFloat(editingBook.price as any) || 0,
        total_stock: parseInt(editingBook.total_stock as any) || 1
      });
      setShowEditModal(false);
      setEditingBook(null);
      refetchBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to update book');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!schoolId || !deletingBook) return;
    setSaving(true);
    try {
      await deleteLibraryBook({
        id: deletingBook.id,
        school_id: schoolId
      });
      setShowDeleteModal(false);
      setDeletingBook(null);
      refetchBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete book');
    } finally {
      setSaving(false);
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !selectedBook) return;
    
    const bId = issueData.borrowerType === 'student' ? issueData.studentId : issueData.staffId;
    if (!bId) {
      alert('Please select a borrower');
      return;
    }

    setSaving(true);
    try {
      await issueLibraryBook({
        school_id: schoolId,
        book_id: selectedBook.id,
        student_id: issueData.borrowerType === 'student' ? bId : null,
        staff_id: issueData.borrowerType === 'staff' ? bId : null,
        due_date: issueData.dueDate,
        remarks: issueData.remarks
      });
      setShowIssueModal(false);
      setSelectedBook(null);
      setIssueData({ ...issueData, studentId: '', staffId: '', studentName: '', staffName: '' });
      setBorrowerSearch('');
      setBookSearch('');
      refetchBooks();
      refetchIssues();
    } catch (err: any) {
      alert(err.message || 'Failed to issue book');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !selectedIssue) return;
    setSaving(true);
    try {
      await returnLibraryBook({
        school_id: schoolId,
        issue_id: selectedIssue.id,
        fine_amount: parseFloat(returnData.fineAmount) || 0,
        remarks: returnData.remarks
      });
      setShowReturnModal(false);
      setSelectedIssue(null);
      refetchBooks();
      refetchIssues();
    } catch (err: any) {
      alert(err.message || 'Failed to return book');
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { icon: <LayoutDashboard size={17} />, label: 'Dashboard', tab: 'dashboard' as Tab },
    { icon: <BookOpen size={17} />, label: 'Book Inventory', tab: 'books' as Tab },
    { icon: <Book size={17} />, label: 'Issued Books', tab: 'issued' as Tab },
    { icon: <FileText size={17} />, label: 'Notices', tab: 'notices' as Tab },
    { icon: <ShoppingBag size={17} />, label: 'Apps', to: '/school-admin/apps' },
  ];

  return (
    <ProtectedRoute allowedRoles={['librarian']}>
      <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
        {/* Sidebar */}
        <div style={{ width: 240, background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fff', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={learnBeeLogo} alt="LearnBee" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Learn<span style={{ color: ACCENT }}>Bee</span> <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>ERP</span></span>
          </div>
          <nav style={{ padding: '12px 8px', flex: 1 }}>
            <div style={{ padding: '4px 12px 10px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Librarian</div>
            {navItems.map(item => {
              const active = tab === (item as any).tab;
              return (
                <div key={item.label} onClick={() => (item as any).to ? navigate((item as any).to) : setTab((item as any).tab as Tab)}
                  style={{ padding: '11px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 11, marginBottom: 2, background: active ? 'rgba(16,185,129,0.15)' : 'transparent', color: active ? '#34d399' : '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 500, borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  {item.icon}<span>{item.label}</span>
                </div>
              );
            })}
          </nav>
          <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#0ea5e9)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'Librarian'}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Librarian</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header style={{ height: 64, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
              {school?.logo_url ? (
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${ACCENT}`, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={school.logo_url} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${ACCENT}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: ACCENT }}>
                  {school?.name?.charAt(0) || 'S'}
                </div>
              )}
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{school?.name || 'Librarian Dashboard'}</div>
            </div>
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 6px 6px', borderRadius: 12, background: profileOpen ? '#f1f5f9' : 'transparent', border: `1px solid ${profileOpen ? '#e2e8f0' : 'transparent'}`, cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#0ea5e9)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{profile?.full_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Librarian</div>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 220, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden', padding: '8px 12px' }}>
                    <div style={{ fontSize: 13, color: '#475569', padding: '6px 4px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: 6 }}>{user?.email}</div>
                    <button onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#dc2626' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
            {tab === 'dashboard' && (
              <>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Welcome, {profile?.full_name?.split(' ')[0]} 📚</h1>
                    <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Library management for {currentSession?.name || 'current session'}.</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Printer size={16} /> Generate Report
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Total Books', value: totalBooks, color: ACCENT, bg: 'rgba(16,185,129,0.08)', icon: <BookOpen size={22} color={ACCENT} /> },
                    { label: 'Available', value: availableBooks, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', icon: <Package size={22} color="#0ea5e9" /> },
                    { label: 'Issued', value: issuedBooks, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: <Book size={22} color="#f59e0b" /> },
                    { label: 'Overdue', value: overdueCount, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: <X size={22} color="#ef4444" /> },
                  ].map(card => (
                    <div key={card.label} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{card.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{card.value}</div>
                      </div>
                    </div>
                  ))}
                </div>



                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>Recent Books</h3>
                    {booksLoading ? <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Loading…</div> : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                          {['Book', 'Stock', 'Rack'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {books.slice(0, 5).map((b: ErpLibraryBook) => (
                            <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#000000' }}>{b.title}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{b.book_number}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: b.issued_qty >= b.total_stock ? '#dc2626' : '#16a34a' }}>
                                  {b.total_stock - b.issued_qty} / {b.total_stock}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>{b.rack_number || '—'}</td>
                            </tr>
                          ))}
                          {books.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No books.</td></tr>}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>Recent Issues</h3>
                    {issuesLoading ? <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Loading…</div> : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                          {['Book', 'Borrower', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {issues.slice(0, 5).map((iss: any) => (
                            <tr key={iss.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#000000' }}>{iss.erp_library_books?.title}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{iss.erp_library_books?.book_number}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#000000' }}>
                                  {iss.student_id ? `${iss.erp_students?.first_name}` : iss.staff?.profiles?.full_name?.split(' ')[0]}
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{iss.student_id ? 'Student' : 'Staff'}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: iss.status === 'returned' ? '#f1f5f9' : '#fff7ed', color: iss.status === 'returned' ? '#64748b' : '#ea580c' }}>{iss.status}</span>
                              </td>
                            </tr>
                          ))}
                          {issues.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No issues.</td></tr>}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}

            {tab === 'books' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Book Inventory</h2>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Manage all library books and their status.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search book…" style={{ padding: '8px 12px 8px 30px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 200, outline: 'none', color: '#000000' }} />
                    </div>
                    <button onClick={() => setShowAddModal(true)} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <Plus size={16} /> Add Book
                    </button>
                  </div>
                </div>
                {booksLoading ? <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading inventory…</div> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      {['Book No.', 'Title', 'Author', 'Category', 'Stock (Avail)', 'Rack', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {filtered.map((b: ErpLibraryBook) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#000000' }}>{b.book_number}</td>
                          <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500, color: '#000000' }}>{b.title}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>{b.author || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>{b.category}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: b.issued_qty >= b.total_stock ? '#dc2626' : '#16a34a' }}>
                              {b.total_stock - b.issued_qty} Available
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Total: {b.total_stock}</div>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>{b.rack_number || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {b.issued_qty < b.total_stock && (
                                <button onClick={() => { setSelectedBook(b); setShowIssueModal(true); }} style={{ background: 'transparent', border: `1px solid ${ACCENT}`, color: ACCENT, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Issue</button>
                              )}
                              <button onClick={() => { setEditingBook(b); setShowEditModal(true); }} style={{ background: 'transparent', border: '1px solid #0ea5e9', color: '#0ea5e9', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                              <button onClick={() => { setDeletingBook(b); setShowDeleteModal(true); }} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No books found.</td></tr>}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'issued' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Issued Books Tracking</h2>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Monitor active book loans and returns.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search issue record…" style={{ padding: '8px 12px 8px 30px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 220, outline: 'none', color: '#000000' }} />
                    </div>
                    <button onClick={() => { setSelectedBook(null); setShowIssueModal(true); setBookSearch(''); setBorrowerSearch(''); }} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <Plus size={16} /> Issue Book
                    </button>
                  </div>
                </div>
                {issuesLoading ? <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading issues…</div> : 
                 issuesError ? <div style={{ textAlign: 'center', padding: 32, color: '#dc2626', background: '#fef2f2', borderRadius: 12 }}>Error fetching issues: {issuesError}</div> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      {['Book', 'Borrower', 'Issue Date', 'Due Date', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#000000', fontSize: 12, fontWeight: 700 }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {filteredIssues.map((iss: any) => (
                        <tr key={iss.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#000000' }}>{iss.erp_library_books?.title}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{iss.erp_library_books?.book_number}</div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#000000' }}>
                              {iss.student_id ? `${iss.erp_students?.first_name} ${iss.erp_students?.last_name}` : iss.staff?.profiles?.full_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{iss.student_id ? `Adm: ${iss.erp_students?.admission_number}` : 'Staff'}</div>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#000000' }}>{new Date(iss.issue_date).toLocaleDateString()}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: (new Date(iss.due_date) < new Date() && iss.status === 'issued') ? '#dc2626' : '#000000', fontWeight: (new Date(iss.due_date) < new Date() && iss.status === 'issued') ? 700 : 500 }}>{new Date(iss.due_date).toLocaleDateString()}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: iss.status === 'returned' ? '#f1f5f9' : (new Date(iss.due_date) < new Date() ? '#fee2e2' : '#fff7ed'), color: iss.status === 'returned' ? '#64748b' : (new Date(iss.due_date) < new Date() ? '#dc2626' : '#ea580c'), textTransform: 'capitalize' }}>
                              {iss.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {iss.status === 'issued' && (
                              <button onClick={() => { setSelectedIssue(iss); setShowReturnModal(true); }} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Return</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredIssues.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No active issue records found.</td></tr>}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'notices' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>School Notices</h2>
                {noticesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading notices…</div>
                ) : notices.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {notices.map((notice: any) => (
                      <div key={notice.id} style={{ padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>{notice.title}</h3>
                          <span style={{ 
                            fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase',
                            background: notice.priority?.toLowerCase() === 'high' ? '#fee2e2' : notice.priority?.toLowerCase() === 'medium' ? '#fef3c7' : '#dcfce7',
                            color: notice.priority?.toLowerCase() === 'high' ? '#dc2626' : notice.priority?.toLowerCase() === 'medium' ? '#d97706' : '#16a34a'
                          }}>
                            {notice.priority}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 12px' }}>{notice.body || notice.content}</p>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                          <span>📅 {new Date(notice.created_at).toLocaleDateString()}</span>
                          {notice.audience && <span>🎯 {notice.audience}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
                    <FileText size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ margin: 0 }}>No notices found.</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Add New Book</h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Enter details for the new library accession.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleAddBook} style={{ padding: 32 }}>
                <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Barcode size={18} /> Scan ISBN / Barcode
                    </div>
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      autoFocus
                      placeholder="Scan barcode here..."
                      value={isbnScan}
                      onChange={(e) => setIsbnScan(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          fetchBookDetails(isbnScan);
                        }
                      }}
                      style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000', fontWeight: 600 }}
                    />
                    <button 
                      type="button"
                      onClick={() => fetchBookDetails(isbnScan)}
                      disabled={isFetching || !isbnScan}
                      style={{ padding: '0 20px', borderRadius: 12, border: 'none', background: '#1e293b', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (isFetching || !isbnScan) ? 0.6 : 1 }}
                    >
                      {isFetching ? 'Fetching...' : 'Fetch Details'}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>Tip: Most barcode scanners act like a keyboard. Scan into this field to auto-fill book details.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Book Title *</label>
                    <div style={{ position: 'relative' }}>
                      <BookOpen size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input required value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} placeholder="e.g. The Great Gatsby" style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Accession / Book No. *</label>
                    <div style={{ position: 'relative' }}>
                      <Hash size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input required value={newBook.book_number} onChange={e => setNewBook({ ...newBook, book_number: e.target.value })} placeholder="e.g. LIB-001" style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Author</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} placeholder="e.g. F. Scott Fitzgerald" style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Publisher</label>
                    <input value={newBook.publisher} onChange={e => setNewBook({ ...newBook, publisher: e.target.value })} placeholder="e.g. Scribner" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Category</label>
                    <select value={newBook.category} onChange={e => setNewBook({ ...newBook, category: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, appearance: 'none', background: '#fff', color: '#000000' }}>
                      {['General', 'Fiction', 'Science', 'Mathematics', 'History', 'Biography', 'Reference'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Edition / ISBN</label>
                    <input value={newBook.edition} onChange={e => setNewBook({ ...newBook, edition: e.target.value })} placeholder="e.g. 1st Edition / ISBN" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Rack / Shelf Location</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input value={newBook.rack_number} onChange={e => setNewBook({ ...newBook, rack_number: e.target.value })} placeholder="e.g. A-12" style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Book Price (Optional)</label>
                    <div style={{ position: 'relative' }}>
                      <IndianRupee size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="number" value={newBook.price} onChange={e => setNewBook({ ...newBook, price: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Total Stock *</label>
                    <input type="number" min="1" required value={newBook.total_stock} onChange={e => setNewBook({ ...newBook, total_stock: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Description / Notes</label>
                    <textarea value={newBook.description} onChange={e => setNewBook({ ...newBook, description: e.target.value })} placeholder="Additional book details..." rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, resize: 'none', color: '#000000' }} />
                  </div>
                </div>

                <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '12px 32px', borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 10px 20px ${ACCENT}33` }}>
                    {saving ? 'Adding Book...' : 'Add Book to Library'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showIssueModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Issue Book</h2>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                    {selectedBook ? `${selectedBook.title} (${selectedBook.book_number})` : 'New book issuance'}
                  </p>
                </div>
                <button onClick={() => { setShowIssueModal(false); setSelectedBook(null); setBookSearch(''); setBorrowerSearch(''); }} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleIssueBook} style={{ padding: 32, maxHeight: '80vh', overflowY: 'auto' }}>
                {!selectedBook ? (
                  <div style={{ marginBottom: 20, position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Search Book *</label>
                    <div style={{ position: 'relative' }}>
                      <BookOpen size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input value={bookSearch} onChange={e => setBookSearch(e.target.value)} 
                        placeholder="Search by title or book number..." 
                        style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                    </div>
                    {bookSearch && matchingBooks.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, marginTop: 4, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 110, overflow: 'hidden' }}>
                        {matchingBooks.map((b: ErpLibraryBook) => (
                          <div key={b.id} onClick={() => { setSelectedBook(b); setBookSearch(''); }} 
                            style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} 
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{b.title}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>No: {b.book_number} • {b.total_stock - b.issued_qty} available</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginBottom: 20, padding: '12px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{selectedBook.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Book No: {selectedBook.book_number}</div>
                    </div>
                    <button type="button" onClick={() => setSelectedBook(null)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, color: '#64748b', cursor: 'pointer' }}>Change</button>
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Borrower Type</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" onClick={() => { setIssueData({ ...issueData, borrowerType: 'student', studentId: '', studentName: '' }); setBorrowerSearch(''); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${issueData.borrowerType === 'student' ? ACCENT : '#e2e8f0'}`, background: issueData.borrowerType === 'student' ? 'rgba(16,185,129,0.05)' : '#fff', color: issueData.borrowerType === 'student' ? ACCENT : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Student</button>
                    <button type="button" onClick={() => { setIssueData({ ...issueData, borrowerType: 'staff', staffId: '', staffName: '' }); setBorrowerSearch(''); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${issueData.borrowerType === 'staff' ? ACCENT : '#e2e8f0'}`, background: issueData.borrowerType === 'staff' ? 'rgba(16,185,129,0.05)' : '#fff', color: issueData.borrowerType === 'staff' ? ACCENT : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Staff</button>
                  </div>
                </div>

                <div style={{ marginBottom: 20, position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Search {issueData.borrowerType === 'student' ? 'Student' : 'Staff'}</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={borrowerSearch} onChange={e => setBorrowerSearch(e.target.value)} 
                      placeholder={issueData.borrowerType === 'student' ? "Name or Admission No..." : "Name or Staff ID..."} 
                      style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>
                  
                  {/* Selected Borrower display */}
                  {(issueData.studentName || issueData.staffName) && !borrowerSearch && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(16,185,129,0.1)', border: `1px solid ${ACCENT}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>{issueData.studentName || issueData.staffName}</span>
                      <button type="button" onClick={() => { setIssueData({ ...issueData, studentId: '', studentName: '', staffId: '', staffName: '' }); }} style={{ border: 'none', background: 'transparent', color: '#065f46', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                  )}

                  {/* Dropdown Results */}
                  {borrowerSearch && matchingBorrowers.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, marginTop: 4, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
                      {matchingBorrowers.map((b: any) => (
                        <div key={b.id} onClick={() => {
                          if (issueData.borrowerType === 'student') {
                            setIssueData({ ...issueData, studentId: b.id, studentName: `${b.first_name} ${b.last_name} (${b.admission_number})` });
                          } else {
                            setIssueData({ ...issueData, staffId: b.id, staffName: `${b.profiles?.full_name} (${b.role})` });
                          }
                          setBorrowerSearch('');
                        }} style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} 
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{issueData.borrowerType === 'student' ? `${b.first_name} ${b.last_name}` : b.profiles?.full_name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{issueData.borrowerType === 'student' ? `Adm: ${b.admission_number} • Class: ${b.erp_classes?.name || '—'}` : `${b.role} • ${b.department || '—'}`}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {borrowerSearch && matchingBorrowers.length === 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, marginTop: 4, padding: '12px', fontSize: 12, color: '#94a3b8', textAlign: 'center', zIndex: 100 }}>No matches found.</div>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Due Date</label>
                  <input type="date" required value={issueData.dueDate} onChange={e => setIssueData({ ...issueData, dueDate: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Remarks</label>
                  <textarea value={issueData.remarks} onChange={e => setIssueData({ ...issueData, remarks: e.target.value })} placeholder="Optional notes..." rows={2} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, resize: 'none', color: '#000000' }} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setShowIssueModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Issuing...' : 'Confirm Issue'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showReturnModal && selectedIssue && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 450, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Return Book</h2>
                <button onClick={() => setShowReturnModal(false)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleReturnBook} style={{ padding: 32 }}>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{selectedIssue.erp_library_books?.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Borrowed by: {selectedIssue.student_id ? `${selectedIssue.erp_students?.first_name} ${selectedIssue.erp_students?.last_name}` : selectedIssue.staff?.profiles?.full_name}</div>
                  <div style={{ fontSize: 12, color: new Date(selectedIssue.due_date) < new Date() ? '#dc2626' : '#64748b', marginTop: 2, fontWeight: new Date(selectedIssue.due_date) < new Date() ? 600 : 400 }}>Due Date: {new Date(selectedIssue.due_date).toLocaleDateString()}</div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Fine Amount (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <IndianRupee size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="number" value={returnData.fineAmount} onChange={e => setReturnData({ ...returnData, fineAmount: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Remarks</label>
                  <textarea value={returnData.remarks} onChange={e => setReturnData({ ...returnData, remarks: e.target.value })} placeholder="Return condition, etc." rows={2} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, resize: 'none', color: '#000000' }} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setShowReturnModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Returning...' : 'Mark as Returned'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {showEditModal && editingBook && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Edit Book Details</h2>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Update information for {editingBook.title}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleEditBook} style={{ padding: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Book Title *</label>
                    <input required value={editingBook.title} onChange={e => setEditingBook({ ...editingBook, title: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Book No. *</label>
                    <input required value={editingBook.book_number} onChange={e => setEditingBook({ ...editingBook, book_number: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Author</label>
                    <input value={editingBook.author || ''} onChange={e => setEditingBook({ ...editingBook, author: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Category</label>
                    <select value={editingBook.category} onChange={e => setEditingBook({ ...editingBook, category: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, appearance: 'none', background: '#fff', color: '#000000' }}>
                      {['General', 'Fiction', 'Science', 'Mathematics', 'History', 'Biography', 'Reference'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Total Stock *</label>
                    <input type="number" min={editingBook.issued_qty} required value={editingBook.total_stock} onChange={e => setEditingBook({ ...editingBook, total_stock: parseInt(e.target.value) })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                    {editingBook.issued_qty > 0 && <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Currently {editingBook.issued_qty} issued.</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Price</label>
                    <input type="number" value={editingBook.price} onChange={e => setEditingBook({ ...editingBook, price: parseFloat(e.target.value) })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Rack</label>
                    <input value={editingBook.rack_number || ''} onChange={e => setEditingBook({ ...editingBook, rack_number: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, color: '#000000' }} />
                  </div>
                </div>
                <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#0ea5e9', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? 'Saving...' : 'Update Book'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showDeleteModal && deletingBook && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, padding: 32, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Delete Book?</h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>{deletingBook.title}</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDeleteBook} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Report Section */}
      <div id="printable-report" style={{ display: 'none' }}>
        <style>
          {`
            @media print {
              body * { visibility: hidden !important; }
              #printable-report, #printable-report * { visibility: visible !important; }
              #printable-report { 
                display: block !important;
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                z-index: 999999;
              }
              @page { size: A4; margin: 1.5cm; }
            }
          `}
        </style>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #334155', paddingBottom: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {school?.logo_url ? (
              <img src={school.logo_url} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🏫</div>
            )}
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{school?.name}</h1>
              <div style={{ fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>{school?.address}</span>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  <span><strong>School Code:</strong> {school?.school_code || '—'}</span>
                  <span><strong>Affiliation No:</strong> {school?.affiliation_number || '—'}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Library Status Report</div>
            <div style={{ fontSize: 13, color: '#1e293b', marginTop: 4 }}>{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Library Statistics Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Books', value: totalBooks },
              { label: 'Available', value: availableBooks },
              { label: 'Issued', value: issuedBooks },
              { label: 'Overdue', value: overdueCount }
            ].map(s => (
              <div key={s.label} style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 40 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Active Issues Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b' }}>Book Title</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b' }}>Borrower</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {issues.filter((iss: any) => iss.status === 'issued').slice(0, 15).map((iss: any) => (
                  <tr key={iss.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>{iss.erp_library_books?.title}</td>
                    <td style={{ padding: '8px 0' }}>{iss.erp_students ? `${iss.erp_students.first_name} ${iss.erp_students.last_name}` : iss.staff?.profiles?.full_name}</td>
                    <td style={{ padding: '8px 0' }}>
                      {new Date(iss.due_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {issues.filter((iss: any) => iss.status === 'issued').length > 15 && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>* Showing first 15 active records</div>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 20, background: '#fff', display: 'inline-block' }}>
              <div style={{ marginBottom: 12 }}>
                <QRCode 
                  value={JSON.stringify({
                    school: school?.name,
                    date: new Date().toISOString(),
                    stats: { total: totalBooks, available: availableBooks, issued: issuedBooks, overdue: overdueCount }
                  })} 
                  size={140}
                />
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Report Verification</div>
              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>Scan to verify integrity</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'fixed', bottom: 40, left: 40, right: 40, borderTop: '1px solid #e2e8f0', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Generated by LearnBee ERP - Librarian Portal</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Authorized Signatory _______________________</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
