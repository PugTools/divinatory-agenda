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
import { supabase } from '@/integrations/supabase/client';

interface GameType {
  id: string;
  name: string;
  value: number;
  description?: string;
  active: boolean;
  sort_order: number;
}

interface ValoresTabProps {
  gameTypes: GameType[];
  onUpdateValores: (valores: Record<string, number>) => Promise<void>;
  onAddGameType: (name: string, value: number) => Promise<void>;
  onRemoveGameType: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const ValoresTab = ({ 
  gameTypes, 
  onUpdateValores, 
  onAddGameType, 
  onRemoveGameType,
  onRefresh
}: ValoresTabProps) => {
  const [newTipo, setNewTipo] = useState({ name: '', value: 0 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: '', name: '' });
  const [renameDialog, setRenameDialog] = useState({ open: false, id: '', oldName: '', newName: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    // Validate with Zod
    const validation = gameTypeSchema.safeParse({ name: newTipo.name, value: newTipo.value });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    // Check if type already exists
    if (gameTypes.some(gt => gt.name.toLowerCase() === newTipo.name.toLowerCase())) {
      toast.error('Tipo já existe.');
      return;
    }

    setIsLoading(true);
    try {
      await onAddGameType(newTipo.name, newTipo.value);
      setNewTipo({ name: '', value: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveConfirm = async () => {
    setIsLoading(true);
    try {
      await onRemoveGameType(deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = async (id: string, name: string, value: number) => {
    // Update using the valores format for backward compatibility
    const updatedValores = gameTypes.reduce((acc, gt) => {
      acc[gt.name] = gt.id === id ? value : gt.value;
      return acc;
    }, {} as Record<string, number>);
    
    await onUpdateValores(updatedValores);
  };

  const handleRenameConfirm = async () => {
    // Validate new name
    const validation = gameTypeSchema.pick({ name: true }).safeParse({ name: renameDialog.newName });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (renameDialog.newName === renameDialog.oldName) {
      setRenameDialog({ open: false, id: '', oldName: '', newName: '' });
      return;
    }

    // Check if name already exists
    if (gameTypes.some(gt => gt.name.toLowerCase() === renameDialog.newName.toLowerCase() && gt.id !== renameDialog.id)) {
      toast.error('Já existe um tipo com esse nome.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('game_types')
        .update({ name: renameDialog.newName })
        .eq('id', renameDialog.id);

      if (error) throw error;

      toast.success('Tipo renomeado com sucesso!');
      setRenameDialog({ open: false, id: '', oldName: '', newName: '' });
      await onRefresh();
    } catch (error: any) {
      toast.error('Erro ao renomear tipo de jogo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Tipos de Jogo e Valores</h3>

        <div className="space-y-4 mb-6">
          {gameTypes.map((gameType) => (
            <div key={gameType.id} className="flex items-center gap-3">
              <div className="flex-1 font-medium">{gameType.name}</div>
              <div className="w-32">
                <Input
                  type="number"
                  value={gameType.value}
                  onChange={(e) => handleValueChange(gameType.id, gameType.name, Number(e.target.value))}
                  className="text-right"
                />
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setRenameDialog({ 
                  open: true, 
                  id: gameType.id, 
                  oldName: gameType.name, 
                  newName: gameType.name 
                })}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => setDeleteDialog({ open: true, id: gameType.id, name: gameType.name })}
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
              <Button 
                onClick={handleAdd} 
                className="w-full bg-gradient-primary"
                disabled={isLoading}
              >
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
            <AlertDialogAction onClick={handleRemoveConfirm} disabled={isLoading}>Remover</AlertDialogAction>
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
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, id: '', oldName: '', newName: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleRenameConfirm} disabled={isLoading}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
