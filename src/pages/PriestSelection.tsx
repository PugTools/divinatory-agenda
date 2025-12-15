import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lock, Calendar, ChevronRight, User } from 'lucide-react';

interface Priest {
  id: string;
  display_name: string | null;
  subdomain: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface PriestSelectionProps {
  priests: Priest[];
}

const PriestSelection = ({ priests }: PriestSelectionProps) => {
  const navigate = useNavigate();

  const selectPriest = (priest: Priest) => {
    if (priest.subdomain) {
      // Navigate with subdomain parameter
      navigate(`/?priest=${priest.subdomain}`);
      window.location.reload(); // Reload to apply the new priest context
    } else {
      // For priests without subdomain, we can't select them properly
      // This shouldn't happen if data is properly configured
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Consultas Espirituais
                </h1>
                <p className="text-sm text-muted-foreground">
                  Escolha um sacerdote para agendar sua consulta
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/cadastro">
                <Button variant="outline" size="sm">
                  Cadastro
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  <Lock className="mr-2 h-4 w-4" />
                  Acesso Sacerdote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Sacerdotes Disponíveis</h2>
            <p className="text-muted-foreground">
              Selecione um sacerdote para ver seus horários disponíveis e agendar uma consulta
            </p>
          </div>

          {priests.length === 0 ? (
            <Card className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Nenhum sacerdote disponível</h3>
                <p className="text-muted-foreground text-sm">
                  Não há sacerdotes ativos no momento. Tente novamente mais tarde.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {priests.map((priest) => (
                <Card 
                  key={priest.id} 
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-primary/50"
                  onClick={() => selectPriest(priest)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={priest.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {getInitials(priest.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {priest.display_name || 'Sacerdote'}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          Disponível
                        </Badge>
                      </div>
                      
                      {priest.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {priest.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <Calendar className="h-4 w-4" />
                          <span>Ver agenda</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Info Card */}
          <Card className="p-4 bg-accent/30 border-accent/50">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Como funciona?</p>
                <p className="text-muted-foreground mt-1">
                  Escolha um sacerdote acima para ver os horários disponíveis. Após selecionar 
                  data e horário, você preencherá seus dados e receberá as instruções de pagamento.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PriestSelection;