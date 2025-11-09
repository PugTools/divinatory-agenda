import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { gameTypeSchema } from '@/schemas/validation';

interface ValoresTabProps {
  valores: Record<string, number>;
  onUpdateValores: (valores: Record<string, number>) => void;
}

export const ValoresTab = ({ valores, onUpdateValores }: ValoresTabProps) => {
  const [newTipo, setNewTipo] = useState({ name: '', value: 0 });
  const [editingValores, setEditingValores] = useState(valores);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, name: '' });
  const [renameDialog, setRenameDialog] = useState({ open: false, oldName: '', newName: '' });

  const handleAdd = () => {
    // Validate with Zod
    const validation = gameTypeSchema.safeParse({ name: newTipo.name, value: newTipo.value });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (editingValores[newTipo.name]) {
      toast.error('Tipo já existe.');
      return;
    }

    const updated = { ...editingValores, [newTipo.name]: newTipo.value };
    setEditingValores(updated);
    onUpdateValores(updated);
    setNewTipo({ name: '', value: 0 });
    toast.success('Tipo adicionado com sucesso!');
  };

  const handleRemoveConfirm = () => {
    const updated = { ...editingValores };
    delete updated[deleteDialog.name];
    setEditingValores(updated);
    onUpdateValores(updated);
    setDeleteDialog({ open: false, name: '' });
    toast.success('Tipo removido com sucesso!');
  };

  const handleValueChange = (nome: string, value: number) => {
    const updated = { ...editingValores, [nome]: value };
    setEditingValores(updated);
    onUpdateValores(updated);
  };

  const handleRenameConfirm = () => {
    // Validate new name
    const validation = gameTypeSchema.pick({ name: true }).safeParse({ name: renameDialog.newName });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (renameDialog.newName === renameDialog.oldName) {
      setRenameDialog({ open: false, oldName: '', newName: '' });
      return;
    }

    if (editingValores[renameDialog.newName]) {
      toast.error('Já existe um tipo com esse nome.');
      return;
    }

    const updated = { ...editingValores };
    const value = updated[renameDialog.oldName];
    delete updated[renameDialog.oldName];
    updated[renameDialog.newName] = value;
    setEditingValores(updated);
    onUpdateValores(updated);
    setRenameDialog({ open: false, oldName: '', newName: '' });
    toast.success('Tipo renomeado com sucesso!');
  };

  return (
    <>
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Tipos de Jogo e Valores</h3>

        <div className="space-y-4 mb-6">
          {Object.entries(editingValores).map(([nome, valor]) => (
            <div key={nome} className="flex items-center gap-3">
              <div className="flex-1 font-medium">{nome}</div>
              <div className="w-32">
                <Input
                  type="number"
                  value={valor}
                  onChange={(e) => handleValueChange(nome, Number(e.target.value))}
                  className="text-right"
                />
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setRenameDialog({ open: true, oldName: nome, newName: nome })}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => setDeleteDialog({ open: true, name: nome })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Adicionar Novo Tipo</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-tipo-name">Nome do jogo</Label>
              <Input
                id="new-tipo-name"
                value={newTipo.name}
                onChange={(e) => setNewTipo({ ...newTipo, name: e.target.value })}
                placeholder="Ex: Ifá"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-tipo-value">Valor (R$)</Label>
              <Input
                id="new-tipo-value"
                type="number"
                value={newTipo.value}
                onChange={(e) => setNewTipo({ ...newTipo, value: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} className="w-full bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Tipo
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o tipo "{deleteDialog.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ ...renameDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear tipo de jogo</DialogTitle>
            <DialogDescription>
              Digite o novo nome para o tipo "{renameDialog.oldName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-input">Novo nome</Label>
              <Input
                id="rename-input"
                value={renameDialog.newName}
                onChange={(e) => setRenameDialog({ ...renameDialog, newName: e.target.value })}
                placeholder="Digite o novo nome"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameConfirm();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, oldName: '', newName: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleRenameConfirm}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
