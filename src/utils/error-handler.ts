/**
 * Maps technical database and auth errors to user-friendly messages in Portuguese
 * Prevents information leakage by hiding internal system details
 */
export function mapErrorToUserMessage(error: any): string {
  // Extract error code or message
  const code = error?.code;
  const message = error?.message?.toLowerCase() || '';

  // Database constraint violations
  if (code === '23505' || message.includes('duplicate') || message.includes('unique constraint')) {
    return 'Este email já está cadastrado.';
  }
  
  if (code === '23503' || message.includes('foreign key')) {
    return 'Erro de referência de dados.';
  }

  // RLS policy violations
  if (message.includes('row-level security') || message.includes('policy')) {
    return 'Você não tem permissão para essa operação.';
  }

  // Authentication errors
  if (message.includes('email not confirmed') || message.includes('confirm')) {
    return 'Por favor, confirme seu email antes de fazer login.';
  }
  
  if (message.includes('invalid credentials') || message.includes('incorrect') || message.includes('invalid login')) {
    return 'Email ou senha incorretos.';
  }

  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'Este email já está cadastrado.';
  }

  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns minutos.';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch failed') || message.includes('connection')) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  // Generic fallback - never expose raw error details
  return 'Ocorreu um erro. Tente novamente mais tarde.';
}
