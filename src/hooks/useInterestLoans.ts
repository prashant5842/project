import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { InterestLoan, InterestPayment, InterestPaymentStatus } from '../types';

interface InterestLoanInput {
  borrower_name: string;
  phone_number: string;
  principal_amount: number;
  loan_date: string;
  principal_return_date: string;
  monthly_interest_rate: number;
  interest_due_day: number;
  notes: string;
}

interface InterestPaymentInput {
  interest_loan_id: string;
  amount: number;
  payment_date: string;
  notes: string;
}

export function useInterestLoans() {
  const [loans, setLoans] = useState<InterestLoan[]>([]);
  const [payments, setPayments] = useState<InterestPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [loansResult, paymentsResult] = await Promise.all([
        supabase.from('interest_loans').select('*').order('loan_date', { ascending: false }),
        supabase.from('interest_payments').select('*').order('due_date', { ascending: false }),
      ]);

      if (loansResult.error) throw loansResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setLoans(loansResult.data || []);
      setPayments(paymentsResult.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching interest loans data:', err);
      setError('Failed to load data');
      setLoans([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateMonthlyInterest = (principal: number, rate: number): number => {
    return (principal * rate) / 100;
  };

  const addLoan = useCallback(async (input: InterestLoanInput): Promise<InterestLoan | null> => {
    try {
      const monthlyInterest = calculateMonthlyInterest(input.principal_amount, input.monthly_interest_rate);

      const { data, error: insertError } = await supabase
        .from('interest_loans')
        .insert({
          borrower_name: input.borrower_name,
          phone_number: input.phone_number || '',
          principal_amount: input.principal_amount,
          loan_date: input.loan_date,
          principal_return_date: input.principal_return_date,
          monthly_interest_rate: input.monthly_interest_rate,
          interest_due_day: input.interest_due_day,
          notes: input.notes || '',
          total_interest_received: 0,
          total_pending_interest: 0,
          principal_returned: false,
          status: 'Active',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create the first interest payment record
      if (data) {
        const loanDate = new Date(input.loan_date);
        const firstDueDate = new Date(loanDate.getFullYear(), loanDate.getMonth() + 1, input.interest_due_day);

        await supabase
          .from('interest_payments')
          .insert({
            interest_loan_id: data.id,
            due_date: firstDueDate.toISOString().split('T')[0],
            due_amount: monthlyInterest,
            amount_received: 0,
            pending_amount: monthlyInterest,
            status: 'Pending',
            notes: '',
          });
      }

      await fetchData();
      return data;
    } catch (err) {
      console.error('Error adding interest loan:', err);
      throw err;
    }
  }, [fetchData]);

  const updateLoan = useCallback(async (id: string, input: Partial<InterestLoanInput>): Promise<InterestLoan | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('interest_loans')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchData();
      return data;
    } catch (err) {
      console.error('Error updating interest loan:', err);
      throw err;
    }
  }, [fetchData]);

  const deleteLoan = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('interest_loans')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchData();
    } catch (err) {
      console.error('Error deleting interest loan:', err);
      throw err;
    }
  }, [fetchData]);

  const closeLoan = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('interest_loans')
        .update({ status: 'Closed', principal_returned: true })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchData();
    } catch (err) {
      console.error('Error closing interest loan:', err);
      throw err;
    }
  }, [fetchData]);

  const getPaymentsForLoan = useCallback(
    (loanId: string) => payments.filter(p => p.interest_loan_id === loanId),
    [payments]
  );

  const recordPayment = useCallback(async (input: InterestPaymentInput): Promise<InterestPayment | null> => {
    try {
      const loan = loans.find(l => l.id === input.interest_loan_id);
      if (!loan) throw new Error('Loan not found');

      // Find the current pending payment or create one if needed
      let payment = payments.find(
        p => p.interest_loan_id === input.interest_loan_id && p.status !== 'Paid'
      );

      if (!payment) {
        // Create a new payment record for this month
        const monthlyInterest = calculateMonthlyInterest(
          Number(loan.principal_amount),
          Number(loan.monthly_interest_rate)
        );
        const today = new Date();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), loan.interest_due_day);

        const { data: newPayment, error: insertError } = await supabase
          .from('interest_payments')
          .insert({
            interest_loan_id: input.interest_loan_id,
            due_date: dueDate.toISOString().split('T')[0],
            due_amount: monthlyInterest,
            amount_received: 0,
            pending_amount: monthlyInterest,
            status: 'Pending',
            notes: '',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        payment = newPayment;
      }

      // Update the payment
      const newAmountReceived = Number(payment!.amount_received) + input.amount;
      const newPendingAmount = Number(payment!.due_amount) - newAmountReceived;
      const newStatus: InterestPaymentStatus = newPendingAmount <= 0 ? 'Paid' : newAmountReceived > 0 ? 'Partial' : 'Pending';

      const { error: paymentUpdateError } = await supabase
        .from('interest_payments')
        .update({
          amount_received: newAmountReceived,
          pending_amount: Math.max(0, newPendingAmount),
          payment_date: input.payment_date,
          status: newStatus,
          notes: input.notes,
        })
        .eq('id', payment!.id);

      if (paymentUpdateError) throw paymentUpdateError;

      // Update the loan's total interest received and pending
      const newTotalReceived = Number(loan.total_interest_received) + input.amount;
      const newTotalPending = Number(loan.total_pending_interest) - input.amount;

      const { error: loanUpdateError } = await supabase
        .from('interest_loans')
        .update({
          total_interest_received: newTotalReceived,
          total_pending_interest: Math.max(0, newTotalPending),
        })
        .eq('id', input.interest_loan_id);

      if (loanUpdateError) throw loanUpdateError;

      await fetchData();

      // Return updated payment
      return payments.find(p => p.id === payment!.id) || null;
    } catch (err) {
      console.error('Error recording interest payment:', err);
      throw err;
    }
  }, [fetchData, loans, payments]);

  const generateNextPayment = useCallback(async (loanId: string): Promise<void> => {
    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan || loan.status === 'Closed') return;

      const monthlyInterest = calculateMonthlyInterest(
        Number(loan.principal_amount),
        Number(loan.monthly_interest_rate)
      );

      // Get the latest payment for this loan
      const loanPayments = payments
        .filter(p => p.interest_loan_id === loanId)
        .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());

      const lastPayment = loanPayments[0];
      const today = new Date();

      let nextDueDate: Date;
      if (lastPayment) {
        const lastDueDate = new Date(lastPayment.due_date);
        nextDueDate = new Date(lastDueDate.getFullYear(), lastDueDate.getMonth() + 1, loan.interest_due_day);
      } else {
        nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, loan.interest_due_day);
      }

      // Check if payment already exists for this due date
      const existingPayment = payments.find(
        p => p.interest_loan_id === loanId && p.due_date === nextDueDate.toISOString().split('T')[0]
      );

      if (!existingPayment) {
        await supabase
          .from('interest_payments')
          .insert({
            interest_loan_id: loanId,
            due_date: nextDueDate.toISOString().split('T')[0],
            due_amount: monthlyInterest,
            amount_received: 0,
            pending_amount: monthlyInterest,
            status: 'Pending',
            notes: '',
          });

        // Update loan's total pending interest
        await supabase
          .from('interest_loans')
          .update({
            total_pending_interest: Number(loan.total_pending_interest) + monthlyInterest,
          })
          .eq('id', loanId);

        await fetchData();
      }
    } catch (err) {
      console.error('Error generating next payment:', err);
    }
  }, [fetchData, loans, payments]);

  const deletePayment = useCallback(async (id: string, loanId: string): Promise<void> => {
    try {
      const payment = payments.find(p => p.id === id);
      if (!payment) return;

      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;

      // Delete the payment
      const { error: deleteError } = await supabase
        .from('interest_payments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update the loan totals
      const newTotalReceived = Number(loan.total_interest_received) - Number(payment.amount_received);
      const newTotalPending = Number(loan.total_pending_interest) - Number(payment.pending_amount);

      const { error: loanUpdateError } = await supabase
        .from('interest_loans')
        .update({
          total_interest_received: Math.max(0, newTotalReceived),
          total_pending_interest: Math.max(0, newTotalPending),
        })
        .eq('id', loanId);

      if (loanUpdateError) throw loanUpdateError;

      await fetchData();
    } catch (err) {
      console.error('Error deleting interest payment:', err);
      throw err;
    }
  }, [fetchData, loans, payments]);

  // Calculate metrics
  const getMetrics = useCallback(() => {
    const activeLoans = loans.filter(l => l.status === 'Active');

    const totalPrincipalLent = activeLoans.reduce((sum, l) => sum + Number(l.principal_amount), 0);

    const monthlyInterestExpected = activeLoans.reduce((sum, l) => {
      return sum + calculateMonthlyInterest(Number(l.principal_amount), Number(l.monthly_interest_rate));
    }, 0);

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const interestReceivedThisMonth = payments
      .filter(p => {
        const paymentDate = p.payment_date ? new Date(p.payment_date) : null;
        return paymentDate && paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + Number(p.amount_received), 0);

    const pendingInterest = activeLoans.reduce((sum, l) => sum + Number(l.total_pending_interest), 0);

    const upcomingDuePayments = payments
      .filter(p => p.status !== 'Paid')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);

    return {
      totalPrincipalLent,
      monthlyInterestExpected,
      interestReceivedThisMonth,
      pendingInterest,
      upcomingDuePayments,
      activeLoansCount: activeLoans.length,
    };
  }, [loans, payments]);

  return {
    loans,
    payments,
    loading,
    error,
    addLoan,
    updateLoan,
    deleteLoan,
    closeLoan,
    getPaymentsForLoan,
    recordPayment,
    generateNextPayment,
    deletePayment,
    getMetrics,
    refetch: fetchData,
  };
}
