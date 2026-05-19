import {
  Users, ClipboardCheck, CreditCard,
  FileText, BookOpen, Smartphone,
  Archive, Banknote, Calendar, Bell
} from 'lucide-react';

export const features = [
  {
    id: 'student-management',
    icon: Users,
    title: 'Student Management',
    desc: 'Complete student profiles, enrollment, transfers, and academic history in one unified view.',
    longDesc: 'Our Student Management system is the core of LearnBee. It allows you to manage the entire lifecycle of a student from admission to graduation. Track academic performance, attendance, disciplinary actions, and more in a centralized database accessible to authorized staff.',
    color: '#4F8EF7',
    depth: 0,
    benefits: [
      'Digital enrollment and admission processing',
      'Comprehensive student profiles with document storage',
      'Academic history and progress tracking',
      'Easy transfer and TC generation'
    ]
  },
  {
    id: 'attendance-tracking',
    icon: ClipboardCheck,
    title: 'Attendance Tracking',
    desc: 'Real-time attendance with automatic parent alerts via SMS and in-app notifications.',
    longDesc: 'Say goodbye to manual attendance registers. LearnBee provides a digital attendance system that is fast and error-free. Teachers can mark attendance in seconds, and parents are instantly notified if their child is absent.',
    color: '#8B5CF6',
    depth: 1,
    benefits: [
      'One-click attendance marking for teachers',
      'Automatic SMS and push notifications to parents',
      'Monthly and annual attendance reports',
      'Integration with biometric devices (optional)'
    ]
  },
  {
    id: 'fees-billing',
    icon: CreditCard,
    title: 'Fees & Billing',
    desc: 'Automated fee scheduling, online payments, receipts, and financial reconciliation.',
    longDesc: 'Simplify your school\'s financial management. Automate fee collection, generate invoices, and provide parents with multiple online payment options. Track pending dues and send automated reminders.',
    color: '#EC4899',
    depth: 2,
    benefits: [
      'Customizable fee structures and schedules',
      'Online payment gateway integration',
      'Automated late fee calculation',
      'Detailed financial reports and tallies'
    ]
  },
  {
    id: 'exam-results',
    icon: FileText,
    title: 'Exam & Results',
    desc: 'Exam scheduling, marks entry, report card generation, and result analytics.',
    longDesc: 'Manage the entire examination process smoothly. From scheduling exams to entering marks and generating beautiful report cards. Provide parents and students with detailed performance analytics.',
    color: '#F59E0B',
    depth: 0,
    benefits: [
      'Easy exam scheduling and seating arrangements',
      'Online marks entry for teachers',
      'Automated report card generation (CBSE, ICSE compliant)',
      'Performance analytics and progress graphs'
    ]
  },
  {
    id: 'teacher-dashboard',
    icon: BookOpen,
    title: 'Teacher Dashboard',
    desc: 'Class sessions, subject assignments, homework tracking, and performance insights.',
    longDesc: 'Empower your teachers with dedicated tools to manage their classrooms effectively. Track assignments, share study materials, and communicate with parents effortlessly.',
    color: '#10B981',
    depth: 1,
    benefits: [
      'Personalized dashboard for every teacher',
      'Homework and assignment management',
      'Direct communication channel with parents',
      'Access to class schedules and routines'
    ]
  },
  {
    id: 'parent-portal',
    icon: Smartphone,
    title: 'Parent Portal',
    desc: 'Parents get instant access to attendance, results, fee receipts, and school notices.',
    longDesc: 'Keep parents involved in their child\'s education. The LearnBee Parent Portal provides a transparent view of the student\'s progress, attendance, and financial status with the school.',
    color: '#6366F1',
    depth: 2,
    benefits: [
      'Real-time updates on student attendance',
      'View and download report cards',
      'Online fee payment and receipt history',
      'Direct messaging with class teachers'
    ]
  },
  {
    id: 'inventory-management',
    icon: Archive,
    title: 'Inventory Management',
    desc: 'Track school assets, books, uniforms, and supplies in real-time.',
    longDesc: 'Efficiently manage school resources. Track inventory levels of textbooks, uniforms, stationery, and laboratory equipment. Automate stock alerts and vendor management.',
    color: '#EF4444',
    depth: 0,
    benefits: [
      'Real-time stock tracking',
      'Automated low-stock alerts',
      'Vendor and purchase order management',
      'Resource allocation tracking'
    ]
  },
  {
    id: 'payroll-management',
    icon: Banknote,
    title: 'Payroll Management',
    desc: 'Automated salary processing, tax calculations, and payslip generation.',
    longDesc: 'Simplify staff payroll. Automate salary calculations based on attendance, manage deductions, and generate compliant payslips with a single click.',
    color: '#10B981',
    depth: 1,
    benefits: [
      'Automated salary calculation',
      'Attendance-integrated deductions',
      'Digital payslip generation and distribution',
      'Tax and compliance reporting'
    ]
  },
  {
    id: 'class-routine',
    icon: Calendar,
    title: 'Routine & Timetable',
    desc: 'Dynamic scheduling and timetable management for classes and teachers.',
    longDesc: 'Create conflict-free timetables. Manage complex schedules for classes, subjects, and teachers. Easily handle substitutions and schedule changes.',
    color: '#F59E0B',
    depth: 2,
    benefits: [
      'Drag-and-drop timetable builder',
      'Automatic conflict detection',
      'Teacher substitution management',
      'Printable and shareable routines'
    ]
  },
  {
    id: 'notice-board',
    icon: Bell,
    title: 'Notice Board & Communication',
    desc: 'Instant circulars and notices for parents, students, and staff.',
    longDesc: 'Digitalize school communication. Send instant circulars, event updates, and emergency notices to the entire school or specific groups.',
    color: '#3B82F6',
    depth: 0,
    benefits: [
      'Targeted notice distribution',
      'Push notifications and SMS integration',
      'Digital consent forms and surveys',
      'Read-receipt tracking'
    ]
  }
];
