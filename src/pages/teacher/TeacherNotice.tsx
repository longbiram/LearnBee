import { useState, useEffect } from 'react';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getNotices } from '../../hooks/useErpAcademics';

const priorityColor: Record<string, { bg: string; color: string }> = {
  high:   { bg: '#fee2e2', color: '#dc2626' },
  medium: { bg: '#fef9c3', color: '#ca8a04' },
  low:    { bg: '#dcfce7', color: '#16a34a' },
};

export default function TeacherNotice() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;
  const [notices, setNotices] = useState<any[]>([]);

  const fetchNotices = async () => {
    if (!schoolId) return;
    try {
      const data = await getNotices({ school_id: schoolId });
      // Filter for 'All' or 'Teachers' audience, if audience is strictly enforced.
      // Usually, 'All' means everyone.
      const visibleNotices = (data || []).filter((n: any) => 
        n.audience === 'All' || n.audience === 'Teachers'
      );
      setNotices(visibleNotices);
    } catch (e) {
      console.error('Error fetching notices:', e);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [schoolId]);

  return (
    <TeacherLayout pageTitle="Notice Board" pageSubtitle="View school announcements">
      {/* Notices list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notices.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            No notices to display.
          </div>
        )}
        {notices.map(n => {
          const pc = priorityColor[n.priority] || priorityColor.low;
          return (
            <div key={n.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 4, minWidth: 4, height: 56, borderRadius: 4, background: pc.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{n.title}</h4>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 16 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: pc.bg, color: pc.color }}>{(n.priority || 'low').toUpperCase()}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontWeight: 500 }}>To: {n.audience}</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0', lineHeight: 1.6 }}>{n.body}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>{n.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </TeacherLayout>
  );
}
