import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Helper to invoke erp-academics functions
async function invokeAcademics(method: string, payload: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('erp-academics', {
    body: { method, payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw new Error(error.message);
  return data;
}

export interface AttendanceRecord {
  id?: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  time?: string;
  remarks?: string;
  date: string;
}

/**
 * Hook to manage student attendance for a specific class/section/date.
 */
export function useErpAttendance(
  schoolId: string | null,
  sessionId: string | null,
  classId: string | null,
  section: string | null,
  date: string
) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!schoolId || !classId || !date) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await invokeAcademics('getAttendance', {
        school_id: schoolId,
        session_id: sessionId,
        class_id: classId,
        section,
        date
      });
      setRecords(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, sessionId, classId, section, date]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  /**
   * Bulk save attendance for the current context.
   */
  const saveAttendance = async (
    attendanceRecords: { student_id: string; status: string; time?: string; remarks?: string }[]
  ) => {
    if (!schoolId || !classId || !date) throw new Error('Missing context for saving attendance');
    setLoading(true);
    setError(null);
    try {
      const result = await invokeAcademics('saveAttendance', {
        school_id: schoolId,
        session_id: sessionId,
        class_id: classId,
        section,
        date,
        attendance_records: attendanceRecords
      });
      await fetchRecords();
      return { success: true, data: result };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  return { records, loading, error, saveAttendance, refetch: fetchRecords };
}

/**
 * One-shot fetch for attendance records.
 */
export async function getAttendance(payload: { 
  school_id: string; 
  session_id?: string; 
  class_id?: string; 
  section?: string | null; 
  date: string 
}) {
  return invokeAcademics('getAttendance', payload);
}
