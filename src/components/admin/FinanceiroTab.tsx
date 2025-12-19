import { useState, useMemo } from 'react';
import { Config } from '@/types/divination';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useFinancialData } from '@/hooks/useFinancialData';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SearchFilter } from '@/components/ui/search-filter';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Phone
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface FinanceiroTabProps {
  config: Config;
  onUpdateConfig: (config: Config) => void;
}

const STATUS_OPTIONS = [
  { value: 'paid', label: 'Pago' },
  { value: 'pending', label: 'Pendente' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const FinanceiroTab = ({ config, onUpdateConfig }: FinanceiroTabProps) => {
  const { stats, loading, updateTransactionStatus, allTransactions } = useFinancialData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter transactions based on search and status
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const matchesSearch = searchQuery === '' || 
        tx.appointment?.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.appointment?.client_whatsapp?.includes(searchQuery) ||
        tx.appointment?.game_type_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [allTransactions, searchQuery, statusFilter]);

  const {
    data: paginatedTransactions,
    pagination,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    setPageSize,
  } = usePagination(filteredTransactions, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PIX Configuration */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-semibold">Configurações de Pagamento PIX</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX</Label>
            <Input
              id="pix-key"
              value={config.pix}
              onChange={(e) => onUpdateConfig({ ...config, pix: e.target.value })}
              placeholder="Digite sua chave PIX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix-label">Nome da Conta</Label>
            <Input
              id="pix-label"
              value={config.pixLabel}
              onChange={(e) => onUpdateConfig({ ...config, pixLabel: e.target.value })}
              placeholder="Nome para identificação"
            />
          </div>
        </div>
      </Card>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">
            R$ {stats?.paidAmount.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.paidTransactions || 0} pagamentos recebidos
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pendente</p>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <p className="text-2xl font-bold text-warning">
            R$ {stats?.pendingAmount.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.pendingTransactions || 0} aguardando pagamento
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Geral</p>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">
            R$ {((stats?.paidAmount || 0) + (stats?.pendingAmount || 0)).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.totalTransactions || 0} transações no total
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-bold">
            {stats?.totalTransactions 
              ? Math.round((stats.paidTransactions / stats.totalTransactions) * 100)
              : 0}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pagamentos confirmados
          </p>
        </Card>
      </div>

      {/* Revenue Chart */}
      {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Receita Mensal (Últimos 6 Meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Receita"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Transactions Table with Pagination */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transações</h3>
          <div className="flex items-center gap-2">
            {filteredTransactions.length !== allTransactions.length && (
              <Badge variant="secondary">{filteredTransactions.length} encontradas</Badge>
            )}
            <Badge variant="outline">{allTransactions.length} total</Badge>
          </div>
        </div>

        <SearchFilter
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar por cliente, WhatsApp ou tipo de jogo..."
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={STATUS_OPTIONS}
          statusPlaceholder="Status"
        />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de Jogo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {transaction.appointment?.client_name}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {transaction.appointment?.client_whatsapp}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.appointment?.game_type_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {transaction.appointment?.scheduled_date ? 
                          new Date(transaction.appointment.scheduled_date).toLocaleDateString('pt-BR') 
                          : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {Number(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {transaction.status === 'paid' ? (
                        <Badge className="bg-success/20 text-success hover:bg-success/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Pago
                        </Badge>
                      ) : transaction.status === 'pending' ? (
                        <Badge variant="outline" className="border-warning text-warning">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive text-destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancelado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-success text-success hover:bg-success/10"
                            onClick={() => updateTransactionStatus(transaction.id, 'paid')}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => updateTransactionStatus(transaction.id, 'cancelled')}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationControls
          currentPage={pagination.page}
          totalPages={totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
};
