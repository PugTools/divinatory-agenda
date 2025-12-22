import { useState, useMemo } from 'react';
import { Appointment } from '@/types/divination';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SearchFilter } from '@/components/ui/search-filter';

interface AppointmentsTabProps {
  agendamentos: Appointment[];
  onOpenAppointment: (appointment: Appointment) => void;
  onRemoveAppointment: (id: string | number) => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const AppointmentsTab = ({ agendamentos, onOpenAppointment, onRemoveAppointment }: AppointmentsTabProps) => {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; appointment: Appointment | null }>({
    open: false,
    appointment: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter appointments based on search and status
  const filteredAppointments = useMemo(() => {
    return agendamentos.filter((apt) => {
      const matchesSearch = searchQuery === '' || 
        apt.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.client_whatsapp.includes(searchQuery) ||
        (apt.game_type_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [agendamentos, searchQuery, statusFilter]);

  const {
    data: paginatedAppointments,
    pagination,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    setPageSize,
  } = usePagination(filteredAppointments, 10);

  const handleDeleteConfirm = () => {
    if (deleteDialog.appointment) {
      onRemoveAppointment(deleteDialog.appointment.id);
      setDeleteDialog({ open: false, appointment: null });
    }
  };

  if (agendamentos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum agendamento registrado ainda.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Agendamentos</h3>
          <div className="flex items-center gap-2">
            {filteredAppointments.length !== agendamentos.length && (
              <Badge variant="secondary">{filteredAppointments.length} encontrados</Badge>
            )}
            <Badge variant="outline">{agendamentos.length} total</Badge>
          </div>
        </div>

        <SearchFilter
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar por nome, WhatsApp ou tipo de jogo..."
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
                <TableHead>WhatsApp</TableHead>
                <TableHead>Jogo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum agendamento encontrado com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : paginatedAppointments.map(appointment => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.client_name}</TableCell>
                  <TableCell>{appointment.client_whatsapp}</TableCell>
                  <TableCell className="text-sm">{appointment.game_type_name}</TableCell>
                  <TableCell>
                    {(() => {
                      const [year, month, day] = appointment.scheduled_date.split('-');
                      return `${day}/${month}/${year}`;
                    })()}
                  </TableCell>
                  <TableCell>{appointment.scheduled_time}</TableCell>
                  <TableCell>
                    <Badge variant={appointment.status === 'Confirmado' ? 'default' : 'secondary'}>
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAppointment(appointment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialog({ open: true, appointment })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o agendamento de{' '}
              <span className="font-semibold">{deleteDialog.appointment?.client_name}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
