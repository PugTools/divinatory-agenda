import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface PaymentTransaction {
  id: string;
  appointment_id: string;
  amount: number;
  status: string;
  payment_method: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  paid_at?: string;
  created_at: string;
  external_id?: string;
  // Joined from appointments
  appointment?: {
    client_name: string;
    client_whatsapp: string;
    game_type_name: string;
    scheduled_date: string;
    scheduled_time: string;
  };
}

export interface FinancialStats {
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  totalTransactions: number;
  pendingTransactions: number;
  paidTransactions: number;
  monthlyRevenue: { month: string; amount: number }[];
  recentTransactions: PaymentTransaction[];
}

export const useFinancialData = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFinancialData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all transactions with appointment details
      const { data: transactions, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          appointments (
            client_name,
            client_whatsapp,
            game_type_name,
            scheduled_date,
            scheduled_time
          )
        `)
        .eq('priest_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Calculate statistics
      const pending = transactions?.filter(t => t.status === 'pending') || [];
      const paid = transactions?.filter(t => t.status === 'paid') || [];

      const pendingAmount = pending.reduce((sum, t) => sum + Number(t.amount), 0);
      const paidAmount = paid.reduce((sum, t) => sum + Number(t.amount), 0);

      // Calculate monthly revenue (last 6 months)
      const monthlyData: { [key: string]: number } = {};
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        monthlyData[key] = 0;
      }

      paid.forEach(transaction => {
        const date = new Date(transaction.paid_at || transaction.created_at);
        const key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        if (monthlyData[key] !== undefined) {
          monthlyData[key] += Number(transaction.amount);
        }
      });

      const monthlyRevenue = Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount,
      }));

      // Transform transactions
      const transformedTransactions: PaymentTransaction[] = transactions?.map(t => ({
        ...t,
        appointment: t.appointments as any,
      })) || [];

      setStats({
        totalRevenue: paidAmount,
        pendingAmount,
        paidAmount,
        totalTransactions: transactions?.length || 0,
        pendingTransactions: pending.length,
        paidTransactions: paid.length,
        monthlyRevenue,
        recentTransactions: transformedTransactions.slice(0, 10),
      });

    } catch (error: any) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Erro ao carregar dados financeiros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: 'paid' | 'cancelled') => {
    if (!user) return;

    try {
      const updates: any = { status };
      
      if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payment_transactions')
        .update(updates)
        .eq('id', transactionId)
        .eq('priest_id', user.id);

      if (error) throw error;

      // Update appointment payment status
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ 
          payment_status: status,
          status: status === 'paid' ? 'confirmed' : 'cancelled'
        })
        .eq('payment_id', transactionId);

      if (appointmentError) throw appointmentError;

      toast({
        title: "Status atualizado",
        description: status === 'paid' ? "Pagamento confirmado!" : "Pagamento cancelado",
      });

      await loadFinancialData();
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [user]);

  return {
    stats,
    loading,
    refreshData: loadFinancialData,
    updateTransactionStatus,
  };
};
