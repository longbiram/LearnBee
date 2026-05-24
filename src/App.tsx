import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WatchDemo from './pages/WatchDemo';
import ScheduleDemo from './pages/ScheduleDemo';
import FeatureDetail from './pages/FeatureDetail';
import ResetPassword from './pages/ResetPassword';
import About from './pages/static/About';
import Blog from './pages/static/Blog';
import Careers from './pages/static/Careers';
import Press from './pages/static/Press';
import Contact from './pages/static/Contact';
import Documentation from './pages/static/Documentation';
import HelpCenter from './pages/static/HelpCenter';
import Status from './pages/static/Status';
import PrivacyPolicy from './pages/static/PrivacyPolicy';
import Terms from './pages/static/Terms';
import Integrations from './pages/static/Integrations';
import Changelog from './pages/static/Changelog';

// Teacher modules
import TeacherDashboardHome from './pages/teacher/TeacherDashboardHome';
import TeacherRoutine from './pages/teacher/TeacherRoutine';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherResults from './pages/teacher/TeacherResults';
import TeacherNotice from './pages/teacher/TeacherNotice';
import TeacherLeave from './pages/teacher/TeacherLeave';
import TeacherSettings from './pages/teacher/TeacherSettings';

// Staff role dashboards
import AccountantDashboard from './pages/AccountantDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import StaffGating from './components/StaffGating';
import ClerkDashboard from './pages/ClerkDashboard';

// School Admin
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import AllStudents from './pages/admin/students/AllStudents';
import AddStudent from './pages/admin/students/AddStudent';
import EditStudent from './pages/admin/students/EditStudent';
import PromoteStudents from './pages/admin/students/PromoteStudents';
import TransferTC from './pages/admin/students/TransferTC';
import IDCards from './pages/admin/students/IDCards';
import TeacherIDCards from './pages/admin/teachers/IDCards';
import AllTeachers from './pages/admin/teachers/AllTeachers';
import AddTeacher from './pages/admin/teachers/AddTeacher';
import EditTeacher from './pages/admin/teachers/EditTeacher';
import ResignedTeachers from './pages/admin/teachers/ResignedTeachers';
import TeacherLeaveRequests from './pages/admin/teachers/LeaveRequests';
import AdminTeacherAttendance from './pages/admin/teachers/TeacherAttendance';
import AllStaffs from './pages/admin/staffs/AllStaffs';
import AddStaff from './pages/admin/staffs/AddStaff';
import Attendance from './pages/admin/Attendance';
import SchoolFees from './pages/admin/fees/SchoolFees';
import HostelFees from './pages/admin/fees/HostelFees';
import TransportFees from './pages/admin/fees/TransportFees';
import Routine from './pages/admin/Routine';
import Notice from './pages/admin/Notice';
import Results from './pages/admin/Results';
import Settings from './pages/admin/Settings';
import Inventory from './pages/admin/Inventory';
import Payroll from './pages/admin/Payroll';
import ClassTeachers from './pages/admin/ClassTeachers';
import SchoolApps from './pages/admin/SchoolApps';
import SchoolAppRunner from './pages/admin/SchoolAppRunner';

// Super Admin
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import SchoolsList from './pages/super-admin/SchoolsList';
import AddSchool from './pages/super-admin/AddSchool';
import Subscriptions from './pages/super-admin/Subscriptions';
import PlansManager from './pages/super-admin/PlansManager';
import Marketplace from './pages/super-admin/Marketplace';
import PlatformSettings from './pages/super-admin/PlatformSettings';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/watch-demo" element={<WatchDemo />} />
        <Route path="/schedule-demo" element={<ScheduleDemo />} />
        <Route path="/features/:featureId" element={<FeatureDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/press" element={<Press />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/status" element={<Status />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/changelog" element={<Changelog />} />

        {/* Teacher */}
        <Route path="/teacher" element={<TeacherDashboardHome />} />
        <Route path="/teacher/routine" element={<TeacherRoutine />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        <Route path="/teacher/results" element={<TeacherResults />} />
        <Route path="/teacher/notice" element={<TeacherNotice />} />
        <Route path="/teacher/leave" element={<TeacherLeave />} />
        <Route path="/teacher/settings" element={<TeacherSettings />} />

        {/* Staff dashboards */}
        <Route path="/accountant" element={<StaffGating><AccountantDashboard /></StaffGating>} />
        <Route path="/librarian" element={<StaffGating><LibrarianDashboard /></StaffGating>} />
        <Route path="/clerk" element={<StaffGating><ClerkDashboard /></StaffGating>} />

        {/* School Admin */}
        <Route path="/school-admin" element={<SchoolAdminDashboard />} />
        <Route path="/school-admin/students" element={<AllStudents />} />
        <Route path="/school-admin/students/add" element={<AddStudent />} />
        <Route path="/school-admin/students/edit/:id" element={<EditStudent />} />
        <Route path="/school-admin/students/promote" element={<PromoteStudents />} />
        <Route path="/school-admin/students/transfer" element={<TransferTC />} />
        <Route path="/school-admin/students/id-cards" element={<IDCards />} />
        <Route path="/school-admin/teachers/id-cards" element={<TeacherIDCards />} />
        <Route path="/school-admin/teachers" element={<AllTeachers />} />
        <Route path="/school-admin/teachers/add" element={<AddTeacher />} />
        <Route path="/school-admin/teachers/edit/:id" element={<EditTeacher />} />
        <Route path="/school-admin/teachers/resigned" element={<ResignedTeachers />} />
        <Route path="/school-admin/teachers/leave-requests" element={<TeacherLeaveRequests />} />
        <Route path="/school-admin/teacher-attendance" element={<AdminTeacherAttendance />} />
        <Route path="/school-admin/staffs" element={<AllStaffs />} />
        <Route path="/school-admin/staffs/add" element={<AddStaff />} />
        <Route path="/school-admin/attendance" element={<Attendance />} />
        <Route path="/school-admin/fees/school" element={<SchoolFees />} />
        <Route path="/school-admin/fees/hostel" element={<HostelFees />} />
        <Route path="/school-admin/fees/transport" element={<TransportFees />} />
        <Route path="/school-admin/routine" element={<Routine />} />
        <Route path="/school-admin/results" element={<Results />} />
        <Route path="/school-admin/notice" element={<Notice />} />
        <Route path="/school-admin/settings" element={<Settings />} />
        <Route path="/school-admin/inventory" element={<Inventory />} />
        <Route path="/school-admin/payroll" element={<Payroll />} />
        <Route path="/school-admin/apps" element={<SchoolApps />} />
        <Route path="/school-admin/apps/:slug" element={<SchoolAppRunner />} />
        <Route path="/school-admin/class-teachers" element={<ClassTeachers />} />

        {/* Super Admin */}
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/schools" element={<SchoolsList />} />
        <Route path="/super-admin/schools/add" element={<AddSchool />} />
        <Route path="/super-admin/subscriptions" element={<Subscriptions />} />
        <Route path="/super-admin/plans" element={<PlansManager />} />
        <Route path="/super-admin/marketplace" element={<Marketplace />} />
        <Route path="/super-admin/settings" element={<PlatformSettings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



