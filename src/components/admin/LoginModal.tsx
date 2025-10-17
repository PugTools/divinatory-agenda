import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (user: string, pass: string) => boolean;
}

export const LoginModal = ({ open, onClose, onLogin }: LoginModalProps) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(user, pass);
    if (success) {
      setError(false);
      setUser('');
      setPass('');
    } else {
      setError(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Acesso Sacerdote</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="admin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              Usuário ou senha incorretos.
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-gradient-primary">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
