import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Expense, ExpenseCategory } from '../types';

interface ExpenseInput {
  date: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: string;
  notes: string;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setExpenses(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (input: ExpenseInput): Promise<Expense | null> => {
    const { data, error: insertError } = await supabase
      .from('expenses')
      .insert({
        date: input.date,
        category: input.category,
        amount: input.amount,
        payment_method: input.payment_method,
        notes: input.notes || '',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding expense:', insertError);
      throw insertError;
    }

    await fetchExpenses();
    return data;
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (id: string, input: Partial<ExpenseInput>): Promise<Expense | null> => {
    const { data, error: updateError } = await supabase
      .from('expenses')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating expense:', updateError);
      throw updateError;
    }

    await fetchExpenses();
    return data;
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting expense:', deleteError);
      throw deleteError;
    }

    await fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
