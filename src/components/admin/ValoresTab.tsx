import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface ValoresTabProps {
  valores: Record<string, number>;
  onUpdateValores: (valores: Record<string, number>) => void;
}

export const ValoresTab = ({ valores, onUpdateValores }: ValoresTabProps) => {
  const [newTipo, setNewTipo] = useState({ name: '', value: 0 });
  const [editingValores, setEditingValores] = useState(valores);

  const handleAdd = () => {
    if (!newTipo.name.trim()) {
      alert('Nome do tipo é obrigatório.');
      return;
    }
    if (editingValores[newTipo.name]) {
      alert('Tipo já existe.');
      return;
    }

    const updated = { ...editingValores, [newTipo.name]: newTipo.value };
    setEditingValores(updated);
    onUpdateValores(updated);
    setNewTipo({ name: '', value: 0 });
  };

  const handleRemove = (nome: string) => {
    if (!confirm(`Remover tipo "${nome}"?`)) return;
    
    const updated = { ...editingValores };
    delete updated[nome];
    setEditingValores(updated);
    onUpdateValores(updated);
  };

  const handleValueChange = (nome: string, value: number) => {
    const updated = { ...editingValores, [nome]: value };
    setEditingValores(updated);
    onUpdateValores(updated);
  };

  const handleRename = (oldName: string) => {
    const newName = prompt('Novo nome para o tipo:', oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;

    const updated = { ...editingValores };
    const value = updated[oldName];
    delete updated[oldName];
    updated[newName] = value;
    setEditingValores(updated);
    onUpdateValores(updated);
  };

  return (
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
            <Button size="sm" variant="outline" onClick={() => handleRename(nome)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleRemove(nome)}>
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
  );
};
