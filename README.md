# MentorX

Plataforma educacional para estudantes e professores, com biblioteca académica, comunidade, cursos e apoio de inteligência artificial.

## Estado actual

**Fundação visual inicial (MVP em desenvolvimento).** Esta versão contém a primeira interface responsiva de apresentação. Autenticação, base de dados, biblioteca privada, comunidade e IA serão implementadas em etapas próprias, com testes de permissões e segurança.

## Stack inicial

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Supabase (planeado para autenticação, PostgreSQL, Storage e Realtime)
- GitHub para versionamento

## Desenvolvimento local

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Verificação de tipos e build:

```bash
npm run typecheck
npm run build
```

## Configuração

Não são necessárias chaves ou variáveis de ambiente para visualizar a interface inicial. Não adicionar segredos ao repositório.

## Próximas etapas

1. Rever a identidade visual e navegação.
2. Definir o modelo de dados e políticas RLS no Supabase.
3. Implementar autenticação e perfis (admin, professor, estudante).
4. Implementar biblioteca privada.
5. Implementar comunidade.
6. Integrar MentorX AI através de backend seguro.

## Segurança

O protótipo actual não contém autenticação nem dados reais. Não utilizar para armazenar informações pessoais ou materiais privados até à implementação e validação dos controlos de acesso.
