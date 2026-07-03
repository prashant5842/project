import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Income } from '../types';

interface IncomeInput {
  date: string;
  source: string;
  amount: number;
  notes: string;
}

export function useIncome() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('incomes')
        .select('*')
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setIncomes(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching incomes:', err);
      setError('Failed to load incomes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const addIncome = useCallback(async (input: IncomeInput): Promise<Income | null> => {
    const { data, error: insertError } = await supabase
      .from('incomes')
      .insert({
        date: input.date,
        source: input.source,
        amount: input.amount,
        notes: input.notes || '',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding income:', insertError);
      throw insertError;
    }

    await fetchIncomes();
    return data;
  }, [fetchIncomes]);

  const updateIncome = useCallback(async (id: string, input: Partial<IncomeInput>): Promise<Income | null> => {
    const { data, error: updateError } = await supabase
      .from('incomes')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating income:', updateError);
      throw updateError;
    }

    await fetchIncomes();
    return data;
  }, [fetchIncomes]);

  const deleteIncome = useCallback(async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('incomes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting income:', deleteError);
      throw deleteError;
    }

    await fetchIncomes();
  }, [fetchIncomes]);

  return {
    incomes,
    loading,
    error,
    addIncome,
    updateIncome,
    deleteIncome,
    refetch: fetchIncomes,
  };
}
