import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2 } from 'lucide-react';
import { signUpSchema } from '@/schemas/validation';
import { toast } from '@/hooks/use-toast';

const Cadastro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with Zod
    const validation = signUpSchema.safeParse({
      email,
      password,
      fullName,
      displayName
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Erro de validação',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(
      validation.data.email,
      validation.data.password,
      validation.data.fullName,
      validation.data.displayName
    );
    setLoading(false);
    
    if (!error) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mystical p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Cadastro de Sacerdote</CardTitle>
          <CardDescription className="text-center">
            Crie sua conta para começar a gerenciar suas consultas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="João Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome Espiritual / Místico</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Babalorixá José"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 8 caracteres, com letras maiúsculas, minúsculas e números
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Conta
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                Faça login
              </Link>
            </div>

            <div className="text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Voltar para o início
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;
