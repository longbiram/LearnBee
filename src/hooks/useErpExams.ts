/**
 * useErpExams.ts
 * All exam data fetched via erp-exams Edge Function.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── shared invoker ──────────────────────────────────────────
async function invokeExams(method: string, payload: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('erp-exams', {
    body: { method, payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─── Types ─────────────────────────────────────────────────────
export interface SubjectConfig {
  subject_id: string;
  subject_name: string;
  max_theory: number;
  max_practical?: number;   // undefined = no practical
  max_internal?: number;    // undefined = no internal
  pass_marks: number;
}

export interface ErpExam {
  id: string;
  school_id: string;
  session_id: string | null;
  class_id: string | null;
  section: string | null;
  name: string;
  subjects_config: SubjectConfig[];
  status: 'draft' | 'published' | 'locked';
  created_at: string;
  erp_classes?: { name: string } | null;
  erp_academic_sessions?: { name: string } | null;
}

export interface ExamMark {
  id: string;
  exam_id: string;
  student_id: string;
  subject_id: string;
  theory_marks: number | null;
  practical_marks: number | null;
  internal_marks: number | null;
  is_absent: boolean;
  entered_by: string | null;
  entered_by_name?: string;
  entered_by_role?: string;
}

// ─── Hook: exam list ────────────────────────────────────────────
export function useExams(schoolId: string | null, sessionId?: string | null) {
  const [exams, setExams] = useState<ErpExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invokeExams('getExams', { school_id: schoolId, session_id: sessionId ?? undefined });
      setExams(Array.isArray(result) ? result : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, sessionId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { exams, loading, error, refetch: fetch };
}

// ─── Hook: marks for one exam ───────────────────────────────────
export function useExamMarks(schoolId: string | null, examId: string | null) {
  const [marks, setMarks] = useState<ExamMark[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!schoolId || !examId) return;
    setLoading(true);
    try {
      const result = await invokeExams('getMarks', { school_id: schoolId, exam_id: examId });
      setMarks(Array.isArray(result) ? result : []);
    } catch {
      setMarks([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, examId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { marks, loading, refetch: fetch };
}

// ─── One-shot mutators ──────────────────────────────────────────
export async function createExam(payload: object) {
  return invokeExams('createExam', payload);
}
export async function updateExam(payload: object) {
  return invokeExams('updateExam', payload);
}
export async function deleteExam(payload: object) {
  return invokeExams('deleteExam', payload);
}
export async function publishExam(payload: object) {
  return invokeExams('publishExam', payload);
}
export async function lockExam(payload: object) {
  return invokeExams('lockExam', payload);
}
export async function upsertMarks(payload: object) {
  return invokeExams('upsertMarks', payload);
}
export async function getStudentReport(payload: object) {
  return invokeExams('getStudentReport', payload);
}

// ─── Student result overrides (remarks, result, rank) ──────────
export async function upsertStudentResult(payload: {
  school_id: string;
  exam_id: string;
  student_id: string;
  custom_remarks?: string;
  custom_result?: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('erp_student_results')
    .upsert({
      ...payload,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'exam_id,student_id' });
  if (error) throw new Error(error.message);
}

export async function getExamStudentResults(schoolId: string, examId: string) {
  const { data, error } = await supabase
    .from('erp_student_results')
    .select('*')
    .eq('school_id', schoolId)
    .eq('exam_id', examId);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    student_id: string;
    custom_remarks: string | null;
    custom_result: string | null;
    rank: number | null;
    rank_in_section: number | null;
  }>;
}

export async function recalculateRanks(schoolId: string, examId: string, studentTotals: Array<{student_id: string; total: number; passed: boolean; section?: string}>) {
  // Sort by total descending — only rank students who passed all subjects
  const passers = studentTotals.filter(s => s.passed).sort((a, b) => b.total - a.total);
  const sections = Array.from(new Set(studentTotals.map(s => s.section ?? '')));

  const upserts = studentTotals.map(s => {
    const rank = passers.findIndex(p => p.student_id === s.student_id) + 1;
    const sectionPassers = passers.filter(p => p.section === s.section);
    const rankInSection = sectionPassers.findIndex(p => p.student_id === s.student_id) + 1;
    return {
      school_id: schoolId,
      exam_id: examId,
      student_id: s.student_id,
      rank: s.passed ? rank : null,
      rank_in_section: s.passed && s.section ? rankInSection : null,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from('erp_student_results')
    .upsert(upserts, { onConflict: 'exam_id,student_id' });
  if (error) throw new Error(error.message);

  return sections; // return for any side effects
}

// ─── Class Teacher management ────────────────────────────────────
export async function getClassTeachers(schoolId: string, sessionId: string) {
  const { data, error } = await supabase
    .from('erp_class_teachers')
    .select(`
      id, class_id, section, teacher_id,
      staff:teacher_id ( id, profile_id, profiles:profile_id ( full_name ) )
    `)
    .eq('school_id', schoolId)
    .eq('session_id', sessionId);
  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

export async function upsertClassTeacher(payload: {
  school_id: string;
  session_id: string;
  class_id: string;
  section?: string | null;
  teacher_id: string;
}) {
  const { error } = await supabase
    .from('erp_class_teachers')
    .upsert(payload, { onConflict: 'school_id,session_id,class_id,section' } as any);
  if (error) throw new Error(error.message);
}

export async function removeClassTeacher(id: string) {
  const { error } = await supabase.from('erp_class_teachers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
