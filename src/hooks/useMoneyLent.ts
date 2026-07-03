import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MoneyLent, MoneyLentStatus, Repayment } from '../types';

interface MoneyLentInput {
  person_name: string;
  amount_given: number;
  date_given: string;
  expected_return_date: string;
  notes: string;
}

interface RepaymentInput {
  money_lent_id: string;
  amount: number;
  date: string;
  notes: string;
}

export function useMoneyLent() {
  const [moneyLentRecords, setMoneyLentRecords] = useState<MoneyLent[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [moneyLentResult, repaymentsResult] = await Promise.all([
        supabase.from('money_lent').select('*').order('date_given', { ascending: false }),
        supabase.from('repayments').select('*').order('date', { ascending: false }),
      ]);

      if (moneyLentResult.error) throw moneyLentResult.error;
      if (repaymentsResult.error) throw repaymentsResult.error;

      setMoneyLentRecords(moneyLentResult.data || []);
      setRepayments(repaymentsResult.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching money lent data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateStatus = (amountGiven: number, amountReturned: number): MoneyLentStatus => {
    if (amountReturned >= amountGiven) return 'Paid';
    if (amountReturned > 0) return 'Partial';
    return 'Pending';
  };

  const addMoneyLent = useCallback(async (input: MoneyLentInput): Promise<MoneyLent | null> => {
    const { data, error: insertError } = await supabase
      .from('money_lent')
      .insert({
        person_name: input.person_name,
        amount_given: input.amount_given,
        date_given: input.date_given,
        expected_return_date: input.expected_return_date,
        amount_returned: 0,
        remaining_balance: input.amount_given,
        status: 'Pending',
        notes: input.notes || '',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding money lent:', insertError);
      throw insertError;
    }

    await fetchData();
    return data;
  }, [fetchData]);

  const updateMoneyLent = useCallback(async (id: string, input: Partial<MoneyLentInput>): Promise<MoneyLent | null> => {
    const { data, error: updateError } = await supabase
      .from('money_lent')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating money lent:', updateError);
      throw updateError;
    }

    await fetchData();
    return data;
  }, [fetchData]);

  const deleteMoneyLent = useCallback(async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('money_lent')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting money lent:', deleteError);
      throw deleteError;
    }

    await fetchData();
  }, [fetchData]);

  const addRepayment = useCallback(async (input: RepaymentInput): Promise<Repayment | null> => {
    const { data: repaymentData, error: repaymentError } = await supabase
      .from('repayments')
      .insert({
        money_lent_id: input.money_lent_id,
        amount: input.amount,
        date: input.date,
        notes: input.notes || '',
      })
      .select()
      .single();

    if (repaymentError) {
      console.error('Error adding repayment:', repaymentError);
      throw repaymentError;
    }

    const record = moneyLentRecords.find(r => r.id === input.money_lent_id);
    if (record) {
      const newAmountReturned = Number(record.amount_returned) + input.amount;
      const newRemainingBalance = Number(record.amount_given) - newAmountReturned;
      const newStatus = calculateStatus(Number(record.amount_given), newAmountReturned);

      const { error: updateError } = await supabase
        .from('money_lent')
        .update({
          amount_returned: newAmountReturned,
          remaining_balance: Math.max(0, newRemainingBalance),
          status: newStatus,
        })
        .eq('id', input.money_lent_id);

      if (updateError) {
        console.error('Error updating money lent after repayment:', updateError);
        throw updateError;
      }
    }

    await fetchData();
    return repaymentData;
  }, [fetchData, moneyLentRecords]);

  const deleteRepayment = useCallback(async (id: string, moneyLentId: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('repayments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting repayment:', deleteError);
      throw deleteError;
    }

    const record = moneyLentRecords.find(r => r.id === moneyLentId);
    const relatedRepayments = repayments.filter(r => r.money_lent_id === moneyLentId && r.id !== id);

    if (record) {
      const totalReturned = relatedRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const newRemainingBalance = Number(record.amount_given) - totalReturned;
      const newStatus = calculateStatus(Number(record.amount_given), totalReturned);

      const { error: updateError } = await supabase
        .from('money_lent')
        .update({
          amount_returned: totalReturned,
          remaining_balance: Math.max(0, newRemainingBalance),
          status: newStatus,
        })
        .eq('id', moneyLentId);

      if (updateError) {
        console.error('Error updating money lent after repayment deletion:', updateError);
        throw updateError;
      }
    }

    await fetchData();
  }, [fetchData, moneyLentRecords, repayments]);

  const getRepaymentsForRecord = useCallback(
    (moneyLentId: string) => repayments.filter(r => r.money_lent_id === moneyLentId),
    [repayments]
  );

  return {
    moneyLentRecords,
    repayments,
    loading,
    error,
    addMoneyLent,
    updateMoneyLent,
    deleteMoneyLent,
    addRepayment,
    deleteRepayment,
    getRepaymentsForRecord,
    refetch: fetchData,
  };
}
