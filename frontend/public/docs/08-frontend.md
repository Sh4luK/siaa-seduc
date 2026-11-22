## 8. Frontend — Next.js
### 8.1 Rotas (App Router)

```
/                          landing pública
/admin                     painel administrativo (sidebar)
/admin/{escolas,coordenadores,professores,alunos,turmas}
/admin/modulos/[modulo]    CRUD genérico de dados
/admin/login
/coordenacao/*             visão geral, alunos, professores, turmas,
                           horarios, disciplinas, notas, comunicados,
                           advertencias, calendario, avaliacoes,
                           mensagens, solicitacoes, importação
/professor/*               dashboard, turmas, alunos, notas,
                           frequencia, conteudos, atividades(+correção),
                           avaliacoes (lista/novo/[id]/editar/corrigir),
                           calendario, comunicados, mensagem, horarios
/aluno/*                   dashboard, boletim, frequencia, conteudos,
                           atividades(+envios), cronograma, horarios,
                           solicitacoes
/responsavel/[alunoId]/*   visão do aluno, boletim, frequencia,
                           avaliacoes, calendario, comunicados,
                           advertencias, horario, mensagens
/blog                      posts, post/[id], perfil [user], novo, editar
/corrigir/*                módulo de correção (legado/alternativo)
/backend-api/*             proxy para o Django (api + media)
```

### 8.2 Padrões frontend

- **CSS Modules** por página (`page.module.css`) — sem framework de UI.
- Autenticação verificada no cliente via `GET /api/*/auth` com `credentials: "include"`; redirect para login em 401.
- Fetches paralelos com `Promise.all` para reduzir tempo de carregamento.
- Proxy `/backend-api` encapsula a URL do backend (`src/app/backend-api/`).
- React Compiler habilitado; imagens via `next/image` (com exceções pontuais `<img>` para blobs de preview).

---
