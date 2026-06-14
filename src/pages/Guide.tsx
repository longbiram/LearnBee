import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ChevronRight, CreditCard, Layout, FileText, Settings, Bell, ClipboardList, UserCheck, Shield } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const guideModules = [
  {
    id: 'dashboard',
    title: 'Admin Dashboard',
    icon: Layout,
    color: '#4F8EF7',
    description: 'Centralized overview of your entire institution. Monitor attendance rates, fee collections, total student and staff counts in real-time.',
    features: ['Quick stats & analytics', 'Recent activity feed', 'Revenue charts', 'Pending tasks alerts']
  },
  {
    id: 'students',
    title: 'Student Management',
    icon: Users,
    color: '#8B5CF6',
    description: 'Complete student lifecycle management from admission to graduation.',
    features: ['Add & manage student profiles', 'Promote students to next academic year', 'Transfer Certificate (TC) generation', 'Bulk ID Card printing']
  },
  {
    id: 'teachers',
    title: 'Staff & Teachers',
    icon: UserCheck,
    color: '#EC4899',
    description: 'Manage teaching and non-teaching staff, track attendance and leaves.',
    features: ['Staff directories & profiles', 'Role-based access control', 'Leave request approvals', 'Staff ID Cards']
  },
  {
    id: 'attendance',
    title: 'Attendance Tracking',
    icon: ClipboardList,
    color: '#10B981',
    description: 'Effortless daily attendance marking for students and staff.',
    features: ['Section-wise student attendance', 'Staff biometrics integration (optional)', 'Attendance shortage alerts', 'Monthly attendance reports']
  },
  {
    id: 'fees',
    title: 'Fees & Billing',
    icon: CreditCard,
    color: '#F59E0B',
    description: 'Comprehensive fee management for tuition, transport, and hostels.',
    features: ['Custom fee structures & installments', 'Online & offline payment collection', 'Automated due reminders', 'Financial reporting & receipts']
  },
  {
    id: 'routine',
    title: 'Routine & Timetable',
    icon: Calendar,
    color: '#6366F1',
    description: 'Smart scheduling for classes and teachers avoiding conflicts.',
    features: ['Class-wise timetable creation', 'Teacher scheduling', 'Conflict detection', 'Substitute management']
  },
  {
    id: 'results',
    title: 'Exams & Results',
    icon: FileText,
    color: '#F43F5E',
    description: 'End-to-end examination management and report card generation.',
    features: ['Exam term creation', 'Marks entry by teachers or admin', 'Automated grading & calculations', 'Printable report cards']
  },
  {
    id: 'notice',
    title: 'Notices & Communication',
    icon: Bell,
    color: '#3B82F6',
    description: 'Keep students, parents, and staff informed instantly.',
    features: ['Digital notice board', 'SMS/Email broadcast', 'Targeted communication', 'Event announcements']
  },
  {
    id: 'settings',
    title: 'System Settings',
    icon: Settings,
    color: '#8B5CF6',
    description: 'Configure your ERP according to your institution\'s rules.',
    features: ['Academic year management', 'Classes & sections setup', 'Role & permissions', 'Institution branding']
  }
];

export default function Guide() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <PageLayout maxWidth={1200}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', marginBottom: 52 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600,
          letterSpacing: '2px', textTransform: 'uppercase', color: '#8B5CF6',
          padding: '5px 14px', border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 100, background: 'rgba(139,92,246,0.07)', marginBottom: 18,
        }}>📚 Administrator Guide</span>
        <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 900, color: '#fff', marginBottom: 14, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
          Master the <br />
          <span style={{ background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            School Admin Dashboard
          </span>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          A complete walkthrough of every module in LearnBee ERP to help you manage your institution efficiently.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24, marginBottom: 60 }}>
        {guideModules.map((module, i) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: 28,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: `${module.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, border: `1px solid ${module.color}30`
            }}>
              <module.icon size={24} color={module.color} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{module.title}</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              {module.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {module.features.map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ marginTop: 5, width: 6, height: 6, borderRadius: '50%', background: module.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          background: 'linear-gradient(135deg, rgba(79,142,247,0.1), rgba(139,92,246,0.1))',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 24, padding: isMobile ? 30 : 50,
          textAlign: 'center', maxWidth: 800, margin: '0 auto',
        }}
      >
        <Shield size={40} color="#A78BFA" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Ready to see it in action?</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 30, maxWidth: 500, marginInline: 'auto' }}>
          Schedule a personalized walkthrough with our experts and discover how LearnBee can transform your school.
        </p>
        <button
          onClick={() => navigate('/schedule-demo')}
          style={{
            padding: '14px 32px', background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
            border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
            boxShadow: '0 10px 30px rgba(139,92,246,0.3)',
          }}
        >
          Schedule a Live Demo <ChevronRight size={18} />
        </button>
      </motion.div>
    </PageLayout>
  );
}
