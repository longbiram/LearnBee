import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FeeCollection {
  id: string;
  student_id: string;
  class_id: string;
  session_id: string;
  receipt_number: string;
  amount_paid: number;
  payment_method: string;
  fee_type: string;
  fee_months: string[];
  collected_by?: string;
  created_at: string;
  erp_students?: { first_name: string; last_name: string; admission_number: string };
  erp_classes?: { name: string };
}

// Reuse the erp-academics invoker since we added our fee endpoints there for simplicity
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

export function useFeeCollections(schoolId: string | null, sessionId: string | null) {
  const [collections, setCollections] = useState<FeeCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (nocache = false) => {
    if (!schoolId || !sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invokeAcademics('getFeeCollections', { school_id: schoolId, session_id: sessionId, nocache });
      setCollections(Array.isArray(result) ? result : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, sessionId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { collections, loading, error, refetch: () => fetch(true) };
}

export function useCollectFee() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collectFee = async (payload: {
    school_id: string;
    student_id: string;
    session_id: string;
    class_id: string;
    amount_paid: number;
    payment_method?: string;
    fee_type: string;
    fee_months?: string[];
  }): Promise<{ success: boolean; data?: FeeCollection; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invokeAcademics('collectFee', payload);
      return { success: true, data: result };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  return { collectFee, loading, error };
}
