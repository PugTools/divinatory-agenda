import { useState } from 'react';
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

interface AppointmentsTabProps {
  agendamentos: Appointment[];
  onOpenAppointment: (appointment: Appointment) => void;
  onRemoveAppointment: (id: string | number) => void;
}

export const AppointmentsTab = ({ agendamentos, onOpenAppointment, onRemoveAppointment }: AppointmentsTabProps) => {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; appointment: Appointment | null }>({
    open: false,
    appointment: null,
  });

  const {
    data: paginatedAppointments,
    pagination,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    setPageSize,
  } = usePagination(agendamentos, 10);

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
          <Badge variant="outline">{agendamentos.length} total</Badge>
        </div>
        
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
              {paginatedAppointments.map(appointment => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.name}</TableCell>
                  <TableCell>{appointment.whatsapp}</TableCell>
                  <TableCell className="text-sm">{appointment.tipo}</TableCell>
                  <TableCell>
                    {(() => {
                      const [year, month, day] = appointment.dataEscolhida.split('-');
                      return `${day}/${month}/${year}`;
                    })()}
                  </TableCell>
                  <TableCell>{appointment.hora}</TableCell>
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
              <span className="font-semibold">{deleteDialog.appointment?.name}</span>?
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
