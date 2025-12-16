import { useState, useEffect } from 'react';
import { PriestProfile } from '@/types/divination';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Globe, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileTabProps {
  profile: PriestProfile | null;
  onUpdateProfile: (updates: Partial<PriestProfile>) => Promise<void>;
}

export const ProfileTab = ({ profile, onUpdateProfile }: ProfileTabProps) => {
  const [displayName, setDisplayName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSubdomain(profile.subdomain || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Nome de exibição é obrigatório');
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (subdomain && !subdomainRegex.test(subdomain)) {
      toast.error('Identificador deve conter apenas letras minúsculas, números e hífens');
      return;
    }

    setSaving(true);
    try {
      await onUpdateProfile({
        display_name: displayName.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        bio: bio.trim()
      });
    } finally {
      setSaving(false);
    }
  };

  const hostname = window.location.hostname;
  const isPreview = hostname.includes('lovableproject.com');
  const isPublished = hostname.includes('lovable.app');
  const personalizedLink = subdomain 
    ? `${window.location.origin}/?priest=${subdomain}`
    : 'Configure seu identificador para gerar o link';

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Perfil do Sacerdote</h3>
            <p className="text-sm text-muted-foreground">
              Configure suas informações públicas
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Pai João, Babalorixá, etc."
            />
            <p className="text-xs text-muted-foreground">
              Este nome aparecerá na página pública para seus clientes
            </p>
          </div>

          {/* Subdomain / Identifier */}
          <div className="space-y-2">
            <Label htmlFor="subdomain" className="flex items-center gap-2">
              Identificador Único
              <Badge variant="secondary" className="text-xs">Importante</Badge>
            </Label>
            <div className="flex gap-2">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="pai-joao"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Usado para criar seu link personalizado. Use apenas letras minúsculas, números e hífens.
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia (opcional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você e seu trabalho espiritual..."
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </div>
      </Card>

      {/* Link Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Globe className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Seu Link Personalizado</h3>
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com seus clientes
            </p>
          </div>
        </div>

        {subdomain ? (
          <div className="space-y-3">
            {isPreview && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                <p className="text-xs text-warning">
                  ⚠️ <strong>Modo Preview:</strong> Publique o projeto para obter o link definitivo para compartilhar com clientes.
                </p>
              </div>
            )}
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border-2 border-dashed border-primary/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <code className="text-sm font-mono text-primary break-all">
                  {personalizedLink}
                </code>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(personalizedLink);
                  toast.success('Link copiado!');
                }}
              >
                Copiar Link
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(personalizedLink, '_blank')}
              >
                Abrir
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Quando você configura um identificador, seus clientes podem acessar sua agenda diretamente pelo link personalizado.
            </p>
          </div>
        ) : (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Identificador não configurado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure um identificador único acima para gerar seu link personalizado. 
                  Sem isso, o sistema usará o primeiro sacerdote ativo por padrão.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};