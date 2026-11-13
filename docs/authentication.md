# Autenticação e identidade

## Decisões da primeira versão

- O Supabase Auth será responsável pelo registo, sessão e recuperação de palavra-passe.
- Cada conta nova recebe automaticamente o papel `student`.
- Os papéis disponíveis são `student`, `teacher` e `admin`.
- Os papéis ficam numa tabela separada (`user_roles`), não nos metadados editáveis pelo utilizador.
- O perfil público/académico fica em `profiles`.
- Row Level Security (RLS) fica activa nas duas tabelas.

## Ficheiros

- `supabase/migrations/202611130001_initial_identity.sql`: tabelas, função de verificação de papel, criação automática de perfil e políticas RLS.
- `src/lib/supabase.ts`: cliente Supabase opcional, activado apenas quando as variáveis de ambiente existem.
- `.env.example`: nomes das variáveis necessárias para o ambiente local.

## Aplicação da migração

1. Criar um projecto Supabase.
2. Abrir o SQL Editor do projecto.
3. Copiar e executar o conteúdo da migração.
4. Confirmar que as tabelas `profiles` e `user_roles` existem e que RLS está activa.
5. Configurar as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de desenvolvimento/deploy.

A chave anon/publishable é própria para uso no cliente quando as políticas RLS estão correctas. A chave `service_role` é secreta e nunca deve ser colocada em variáveis `VITE_*`, no browser ou no GitHub.

## Primeiro administrador

Por segurança, nenhum utilizador pode escolher o próprio papel durante o registo. Depois de criar a conta que será administradora, executar manualmente no SQL Editor, substituindo o email:

```sql
update public.user_roles
set role = 'admin'
where user_id = (
  select id from auth.users where email = 'admin@exemplo.com'
);
```

Fazer isso apenas para uma conta controlada pelo proprietário da MentorX.

## Limites desta etapa

Esta etapa prepara a base de dados e o cliente. O formulário de registo/login e a recuperação de palavra-passe ainda não estão ligados, e a migração ainda não foi aplicada a um projecto Supabase. Não inserir dados reais até concluir a configuração e testar as políticas com contas de estudante, professor e administrador.
