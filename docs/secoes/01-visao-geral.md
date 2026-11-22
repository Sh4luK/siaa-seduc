## 1. Visão Geral
O **SIAA-SEDUC** é uma plataforma web de gestão escolar desenvolvida para a rede estadual de ensino do Piauí (SEDUC-PI), no âmbito do programa FAPEPI. O sistema integra os principais atores do ambiente escolar — **administradores, coordenadores, professores, alunos e responsáveis** — em um único ecossistema digital.

### 1.1 Objetivos

- Centralizar a gestão de dados acadêmicos (turmas, disciplinas, alunos, professores).
- Permitir o lançamento e acompanhamento de **notas por trimestre**, **frequência**, **horários** e **conteúdos programados**.
- Oferecer aos alunos e responsáveis visibilidade em tempo real sobre **boletim, frequência, atividades, avaliações e comunicados**.
- Disponibilizar ferramentas de **avaliação digital**: criação de provas com questões objetivas/subjetivas, emissão de PDF, gabarito e correção por fotografia do cartão-resposta.
- Incluir um **módulo de blog** para publicações da comunidade escolar.

### 1.2 Perfis de usuário

| Perfil | Rota base | Responsabilidades |
|---|---|---|
| Administrador | `/admin` | Gestão global: escolas, coordenadores, professores, alunos, turmas e todos os módulos de dados |
| Coordenador | `/coordenacao` | Gestão da escola: professores, alunos, turmas, horários, notas, comunicados, advertências, calendário |
| Professor | `/professor` | Conteúdos, atividades, avaliações, frequência, notas, mensagens, calendário |
| Aluno | `/aluno` | Boletim, frequência, atividades, conteúdos, cronograma, solicitações |
| Responsável | `/responsavel` | Acompanhamento do aluno vinculado: boletim, frequência, comunicados, mensagens |
| Blog | `/blog` | Publicações e comunidade |

---
