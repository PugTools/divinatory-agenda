import { useState, useEffect, useRef } from 'react';
import { PriestProfile } from '@/types/divination';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Globe, Save, AlertCircle, CheckCircle, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { subdomainSchema } from '@/schemas/validation';
import { getHostnameInfo, getPersonalizedLink } from '@/utils/hostname';
import { supabase } from '@/integrations/supabase/client';

interface ProfileTabProps {
  profile: PriestProfile | null;
  onUpdateProfile: (updates: Partial<PriestProfile>) => Promise<void>;
}

export const ProfileTab = ({ profile, onUpdateProfile }: ProfileTabProps) => {
  const [displayName, setDisplayName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSubdomain(profile.subdomain || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await onUpdateProfile({ avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      toast.success('Avatar atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload do avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'SA';
  };

  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  const validateSubdomain = (value: string) => {
    if (!value) {
      setSubdomainError(null);
      return true;
    }
    
    const result = subdomainSchema.safeParse(value);
    if (!result.success) {
      setSubdomainError(result.error.errors[0].message);
      return false;
    }
    setSubdomainError(null);
    return true;
  };

  const handleSubdomainChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(sanitized);
    if (sanitized) {
      validateSubdomain(sanitized);
    } else {
      setSubdomainError(null);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Nome de exibição é obrigatório');
      return;
    }

    // Validate subdomain with advanced rules
    if (subdomain && !validateSubdomain(subdomain)) {
      toast.error(subdomainError || 'Identificador inválido');
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

  // Use centralized hostname utility
  const { isPreview } = getHostnameInfo();
  const personalizedLink = subdomain 
    ? getPersonalizedLink(subdomain)
    : 'Configure seu identificador para gerar o link';

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          {/* Avatar Upload */}
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Perfil do Sacerdote</h3>
            <p className="text-sm text-muted-foreground">
              Configure suas informações públicas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique na foto para alterar o avatar
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
                onChange={(e) => handleSubdomainChange(e.target.value)}
                placeholder="pai-joao"
                className={`flex-1 ${subdomainError ? 'border-destructive' : ''}`}
              />
            </div>
            {subdomainError ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {subdomainError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Mínimo 3 caracteres. Deve começar com letra e terminar com letra/número.
              </p>
            )}
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