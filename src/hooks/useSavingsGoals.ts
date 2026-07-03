import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SavingsGoal } from '../types';

interface SavingsGoalInput {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
}

export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('savings_goals')
        .select('*')
        .order('deadline', { ascending: true });

      if (fetchError) throw fetchError;
      setGoals(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching savings goals:', err);
      setError('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = useCallback(async (input: SavingsGoalInput): Promise<SavingsGoal | null> => {
    const { data, error: insertError } = await supabase
      .from('savings_goals')
      .insert({
        name: input.name,
        target_amount: input.target_amount,
        current_amount: input.current_amount || 0,
        deadline: input.deadline,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding savings goal:', insertError);
      throw insertError;
    }

    await fetchGoals();
    return data;
  }, [fetchGoals]);

  const updateGoal = useCallback(async (id: string, input: Partial<SavingsGoalInput>): Promise<SavingsGoal | null> => {
    const { data, error: updateError } = await supabase
      .from('savings_goals')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating savings goal:', updateError);
      throw updateError;
    }

    await fetchGoals();
    return data;
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting savings goal:', deleteError);
      throw deleteError;
    }

    await fetchGoals();
  }, [fetchGoals]);

  const addFunds = useCallback(async (id: string, amount: number): Promise<void> => {
    const goal = goals.find(g => g.id === id);
    if (!goal) throw new Error('Goal not found');

    const newAmount = Number(goal.current_amount) + amount;
    const { error: updateError } = await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount })
      .eq('id', id);

    if (updateError) throw updateError;
    await fetchGoals();
  }, [fetchGoals, goals]);

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    addFunds,
    refetch: fetchGoals,
  };
}
