## 9. Módulos Funcionais
### 9.1 Avaliações (destaque)

Ciclo completo implementado:

1. **Criação/Edição** (`/professor/avaliacoes/novo`, `/editar`): título, data, turma, disciplina, texto introdutório, questões manuais ou extraídas de PDF, questões objetivas (alternativas A–E com flag `correta`) e subjetivas (linhas de resposta), subquestões aninhadas (a, b, c...) e upload de imagens por questão.
2. **Emissão de PDF**: prova formatada com cabeçalho, questões hierárquicas e **tabela de gabarito** (círculos para preencher) — gerada apenas quando 100% das questões são objetivas.
3. **Visualização** (`/[avaliacaoId]`): detalhe hierárquico, gabarito em tabela (letra correta por questão/subquestão), ações de editar/excluir/corrigir.
4. **Correção** (`/[avaliacaoId]/corrigir`): lista todos os alunos da turma da avaliação; para avaliações 100% objetivas, upload de foto do gabarito preenchido + nota; para avaliações com subjetivas, correção manual da nota. Dados persistidos em `AvaliacaoCorrecao`.

### 9.2 Notas

Lançamento por trimestre (NM1–3, RPT, MT, MTF) com médias (MA, PF, MAF, RCF), carga horária (TGF) e situação final (RF). Acesso via `/professor/notas/[turmaId]` e `/coordenacao/notas/[turmaId]`.

### 9.3 Frequência e aulas

Registro de presença por aula; aulas com assunto e estratégia; visão por turma e por aluno.

### 9.4 Atividades

Criação com arquivo e questões; alunos enviam arquivo/texto; professor corrige envios (`/professor/atividades/[id]/corrigir/[envioId]`); alunos podem solicitar novo envio.

### 9.5 Comunicação

Comunicados (turma ou geral), calendário de eventos, advertências/penalidades/suspensões, chat professor↔coordenação e responsável↔professor/coordenação.

### 9.6 Administração

Painel `/admin` com gestão cadastral (escolas, coordenadores, professores, alunos, turmas — incluindo renomear turma) e **CRUD genérico de 14 módulos de dados** via `/admin/modulos/[modulo]` (tabela + busca + modal de criação/edição + exclusão), além de importação de planilhas na coordenação.

### 9.7 Blog

Publicações em markdown com comentários, curtidas e perfis de autores.

---
