import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ErpStudent {
  id: string;
  admission_number: string;
  roll_number: string | null;
  first_name: string;
  last_name: string;
  gender: string | null;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  father_name: string | null;
  mother_name: string | null;
  parent_contact: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  status: string;
  current_section: string | null;
  current_class_id: string | null;
  current_session_id: string | null;
  created_at: string;
  birth_cert_url?: string | null;
  caste_cert_url?: string | null;
  other_doc_url?: string | null;
  other_docs?: any[] | null;
  is_hosteler?: boolean;
  photo_url?: string | null;
  erp_classes?: { name: string; sections: string[] } | null;
  erp_academic_sessions?: { name: string } | null;
}

interface Filters {
  session_id?: string;
  class_id?: string;
  current_section?: string;
}

async function invokeErpStudents(session: any, method: string, payload: object) {
  const { data, error } = await supabase.functions.invoke('erp-students', {
    body: { method, payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ──────────────────────────────────────────
// Hook: list students
// ──────────────────────────────────────────
export function useStudents(schoolId: string | null, filters: Filters = {}) {
  const [students, setStudents] = useState<ErpStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const result = await invokeErpStudents(session, 'getStudents', {
        school_id: schoolId,
        ...filters,
      });
      setStudents(Array.isArray(result) ? result : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, filters.session_id, filters.class_id, filters.current_section]);

  useEffect(() => { fetch(); }, [fetch]);

  return { students, loading, error, refetch: fetch };
}

// ──────────────────────────────────────────
// Hook: create student
// ──────────────────────────────────────────
export function useCreateStudent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStudent = async (studentData: Record<string, any>): Promise<{ success: boolean; data?: ErpStudent; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const result = await invokeErpStudents(session, 'createStudent', studentData);
      return { success: true, data: result };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  return { createStudent, loading, error };
}

// ──────────────────────────────────────────
// Hook: update student
// ──────────────────────────────────────────
export function useUpdateStudent() {
  const [loading, setLoading] = useState(false);

  const updateStudent = async (id: string, schoolId: string, updateFields: Record<string, any>) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const result = await invokeErpStudents(session, 'updateStudent', { id, school_id: schoolId, updateFields });
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  return { updateStudent, loading };
}

// ──────────────────────────────────────────
// Hook: delete student
// ──────────────────────────────────────────
export function useDeleteStudent() {
  const [loading, setLoading] = useState(false);

  const deleteStudent = async (id: string, schoolId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const result = await invokeErpStudents(session, 'deleteStudent', { id, school_id: schoolId });
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  return { deleteStudent, loading };
}
