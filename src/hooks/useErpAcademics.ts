/**
 * useErpAcademics.ts
 * All data fetched via erp-academics Edge Function — no direct DB access.
 * Available methods: getClasses | getAcademicSessions | getStaff | getSchoolInfo
 *                    createStaff | updateStaff | deleteStaff | createClass | etc.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── shared invoker ──────────────────────────────────────────
async function invokeAcademics(method: string, payload: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('erp-academics', {
    body: { method, payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw new Error(error.message);
  if (data && data.error) throw new Error(data.error);
  return data;
}

// ─── Types ───────────────────────────────────────────────────
export interface ErpClass {
  id: string;
  name: string;
  sections: string[];
  status: string;
  raw_details?: any;
}

export interface ErpSession {
  id: string;
  name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
  status: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  logo_url: string | null;
  admin_email: string;
  contact_phone: string | null;
  website: string | null;
  board_affiliation: string | null;
  affiliation_number: string | null;
  dise_code: string | null;
  school_code: string | null;
  latitude: number | null;
  longitude: number | null;
  subscription_plan?: string | null;
  raw_details?: any;
}

export interface ErpStaff {
  id: string;
  profile_id?: string;
  role: string;
  designation: string | null;
  department: string | null;
  phone: string | null;
  status: string;
  profiles: { full_name: string; email: string | null } | null;
  teacher_subjects?: ErpTeacherSubject[];
  raw_details?: any;
}

export interface ErpSubject {
  id: string;
  class_id: string;
  name: string;
  type?: string;
}

export interface ErpTeacherSubject {
  id?: string;
  staff_id?: string;
  class_id: string;
  section: string | null;
  subject_id: string;
  subject_name?: string;
}

export interface ErpClassTeacher {
  id: string;
  school_id: string;
  session_id: string;
  class_id: string;
  section: string | null;
  teacher_id: string;
  created_at: string;
  // joined fields
  class_name?: string;
  teacher_name?: string;
}

export interface ErpLibraryBook {
  id: string;
  book_number: string;
  title: string;
  author: string | null;
  publisher: string | null;
  edition: string | null;
  isbn: string | null;
  category: string;
  rack_number: string | null;
  price: number;
  total_stock: number;
  issued_qty: number;
  status: 'available' | 'issued' | 'lost' | 'damaged' | 'out of stock';
  description: string | null;
}

export interface ErpLibraryIssue {
  id: string;
  book_id: string;
  student_id: string | null;
  staff_id: string | null;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  fine_amount: number;
  status: 'issued' | 'returned' | 'overdue';
  remarks: string | null;
  // joined fields
  erp_library_books?: { title: string; book_number: string };
  erp_students?: { first_name: string; last_name: string; admission_number: string };
  staff?: { profiles: { full_name: string } };
}

// ─── Hook: classes + sessions ────────────────────────────────
export function useErpClasses(schoolId: string | null) {
  const [classes, setClasses] = useState<ErpClass[]>([]);
  const [sessions, setSessions] = useState<ErpSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      invokeAcademics('getClasses', { school_id: schoolId }),
      invokeAcademics('getAcademicSessions', { school_id: schoolId }),
    ])
      .then(([cls, sess]) => {
        setClasses(Array.isArray(cls) ? cls : []);
        setSessions(Array.isArray(sess) ? sess : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => { fetch(); }, [fetch]);

  const currentSession = sessions.find(s => s.is_current) ?? sessions[0] ?? null;
  return { classes, sessions, currentSession, loading, error, refetch: fetch };
}


// ─── Hook: staff list ────────────────────────────────────────
export function useErpStaff(schoolId: string | null) {
  const [staff, setStaff] = useState<ErpStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invokeAcademics('getStaff', { school_id: schoolId });
      setStaff(Array.isArray(result) ? result : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [schoolId]);
  return { staff, loading, error, refetch: fetch };
}

// ─── Hook: single staff member ────────────────────────────────
export function useErpStaffMember(schoolId: string | null, staffId: string | null) {
  const [member, setMember] = useState<ErpStaff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId || !staffId) return;
    setLoading(true);
    setError(null);
    invokeAcademics('getStaffMember', { school_id: schoolId, staff_id: staffId })
      .then(d => setMember(d))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [schoolId, staffId]);

  return { member, loading, error };
}

// ─── Hook: school info ───────────────────────────────────────
export function useSchoolInfo(schoolId: string | null) {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    invokeAcademics('getSchoolInfo', { school_id: schoolId })
      .then(d => setSchool(d))
      .catch(() => {/* silent */ })
      .finally(() => setLoading(false));
  }, [schoolId]);

  return { school, loading };
}

// ─── Hook: subjects ──────────────────────────────────────────
export function useErpSubjects(schoolId: string | null, classId?: string | null) {
  const [subjects, setSubjects] = useState<ErpSubject[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    invokeAcademics('getSubjects', { school_id: schoolId, class_id: classId })
      .then(d => {
        const arr = Array.isArray(d) ? d : [];
        if (classId) {
          setSubjects(arr.filter(s => s.class_id === classId));
        } else {
          setSubjects(arr);
        }
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }, [schoolId, classId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { subjects, loading, refetch: fetch };
}

// ─── Hook: class teachers ────────────────────────────────────
export function useErpClassTeachers(schoolId: string | null, sessionId: string | null) {
  const [classTeachers, setClassTeachers] = useState<ErpClassTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId || !sessionId) return;
    setLoading(true);
    setError(null);
    invokeAcademics('getClassTeachers', { school_id: schoolId, session_id: sessionId })
      .then(d => setClassTeachers(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [schoolId, sessionId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { classTeachers, loading, error, refetch: fetch };
}

export function useErpNotices(schoolId: string | null) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    invokeAcademics('getNotices', { school_id: schoolId })
      .then(d => setNotices(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { notices, loading, error, refetch: fetch };
}

// ─── Hook: library books ─────────────────────────────────────
export function useLibraryBooks(schoolId: string | null, sessionId: string | null) {
  const [books, setBooks] = useState<ErpLibraryBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    invokeAcademics('getLibraryBooks', { school_id: schoolId, session_id: sessionId })
      .then(d => setBooks(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [schoolId, sessionId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { books, loading, error, refetch: fetch };
}

// ─── Hook: library issues ────────────────────────────────────
export function useLibraryIssues(schoolId: string | null, status?: string) {
  const [issues, setIssues] = useState<ErpLibraryIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    invokeAcademics('getLibraryIssues', { school_id: schoolId, status })
      .then(d => setIssues(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [schoolId, status]);

  useEffect(() => { fetch(); }, [fetch]);
  return { issues, loading, error, refetch: fetch };
}

// ─── One-shot mutators (not hooks) ───────────────────────────
export async function createStaff(payload: object) {
  return invokeAcademics('createStaff', payload);
}
export async function updateStaff(payload: object) {
  return invokeAcademics('updateStaff', payload);
}
export async function deleteStaff(payload: object) {
  return invokeAcademics('deleteStaff', payload);
}
export async function getStaffMember(payload: object) {
  return invokeAcademics('getStaffMember', payload);
}
export async function createClass(payload: object) {
  return invokeAcademics('createClass', payload);
}
export async function createAcademicSession(payload: object) {
  return invokeAcademics('createAcademicSession', payload);
}
export async function updateAcademicSession(payload: object) {
  return invokeAcademics('updateAcademicSession', payload);
}
export async function updateClass(payload: object) {
  return invokeAcademics('updateClass', payload);
}
export async function updateSchoolInfo(payload: object) {
  return invokeAcademics('updateSchoolInfo', payload);
}
export async function createSubject(payload: object) {
  return invokeAcademics('createSubject', payload);
}
export async function deleteSubject(payload: object) {
  return invokeAcademics('deleteSubject', payload);
}
export async function assignClassTeacher(payload: object) {
  return invokeAcademics('assignClassTeacher', payload);
}
export async function removeClassTeacher(payload: object) {
  return invokeAcademics('removeClassTeacher', payload);
}
export async function getRoutine(payload: object) {
  return invokeAcademics('getRoutine', payload);
}
export async function saveRoutine(payload: object) {
  return invokeAcademics('saveRoutine', payload);
}
export async function getNotices(payload: object) {
  return invokeAcademics('getNotices', payload);
}
export async function createNotice(payload: object) {
  return invokeAcademics('createNotice', payload);
}
export async function getStaffAttendance(payload: object) {
  return invokeAcademics('getStaffAttendance', payload);
}
export async function updateNotice(payload: object) {
  return invokeAcademics('updateNotice', payload);
}
export async function deleteNotice(payload: object) {
  return invokeAcademics('deleteNotice', payload);
}
export async function getFeeCollections(payload: object) {
  return invokeAcademics('getFeeCollections', payload);
}
export async function collectFee(payload: object) {
  return invokeAcademics('collectFee', payload);
}

export async function getTeacherRoutine(payload: object) {
  return invokeAcademics('getTeacherRoutine', payload);
}

// ─── Inventory mutators ──────────────────────────────────────
export async function getInventoryItems(payload: object) {
  return invokeAcademics('getInventoryItems', payload);
}
export async function createInventoryItem(payload: object) {
  return invokeAcademics('createInventoryItem', payload);
}
export async function updateInventoryItem(payload: object) {
  return invokeAcademics('updateInventoryItem', payload);
}
export async function deleteInventoryItem(payload: object) {
  return invokeAcademics('deleteInventoryItem', payload);
}
export async function getInventorySales(payload: object) {
  return invokeAcademics('getInventorySales', payload);
}
export async function createInventorySale(payload: object) {
  return invokeAcademics('createInventorySale', payload);
}
export async function getInventoryStats(payload: object) {
  return invokeAcademics('getInventoryStats', payload);
}

// ─── Notification mutators ───────────────────────────────────
export async function getNotifications(payload: object) {
  return invokeAcademics('getNotifications', payload);
}
export async function createNotification(payload: object) {
  return invokeAcademics('createNotification', payload);
}
export async function deleteNotification(payload: object) {
  return invokeAcademics('deleteNotification', payload);
}
export async function markNotificationsRead(payload: object) {
  return invokeAcademics('markNotificationsRead', payload);
}

// ─── Library mutators ────────────────────────────────────────
export async function createLibraryBook(payload: object) {
  return invokeAcademics('createLibraryBook', payload);
}
export async function updateLibraryBook(payload: object) {
  return invokeAcademics('updateLibraryBook', payload);
}
export async function deleteLibraryBook(payload: object) {
  return invokeAcademics('deleteLibraryBook', payload);
}
export async function issueLibraryBook(payload: object) {
  return invokeAcademics('issueLibraryBook', payload);
}
export async function returnLibraryBook(payload: object) {
  return invokeAcademics('returnLibraryBook', payload);
}
export async function getLibraryBooks(payload: object) {
  return invokeAcademics('getLibraryBooks', payload);
}
export async function getLibraryIssues(payload: object) {
  return invokeAcademics('getLibraryIssues', payload);
}
export async function getAttendance(payload: object) {
  return invokeAcademics('getAttendance', payload);
}
export async function saveAttendance(payload: object) {
  return invokeAcademics('saveAttendance', payload);
}
