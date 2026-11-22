## 6. Modelo de Dados
O schema é relacional e centrado na escola. Abaixo os models por domínio.

### 6.1 Pessoas e acessos

| Model | Descrição | Campos-chave |
|---|---|---|
| `Admin` | Administrador do sistema | `nome_completo`, `senha` |
| `Coordenador` | Coordenador escolar | `nome_completo`, `senha`, `escola`, `ip` |
| `Professor` | Docente | `nome_completo`, `senha`, `ip` |
| `Estudante` | Aluno | `posicao_ordem`, `nome_completo`, `escola`, `serie`, `periodo`, `curso`, `turma`, `modo_de_ensino`, `senha`, `ip` |
| `Responsavel` | Responsável legal | `nome_completo`, `senha`, `ip` |
| `Blogger` | Autor do blog | perfil público |
| `Sessao` | Sessão de login | user_type, user_id, token, expiração |

### 6.2 Estrutura acadêmica

| Model | Descrição |
|---|---|
| `Escola` | Escola (INEP, endereço, contato) |
| `AtravessaPor` | Vínculo professor↔turma (`professor`, `escola`, `turma`, `etapa`, `disciplina_lecionada`) |
| `Disciplina` | Disciplina com M2M `professores` |
| `HorarioAula` | Grade semanal (`turma`, `dia_semana` SEG–SEX, `hora_inicio`, `hora_fim`) |

### 6.3 Avaliação do aluno

| Model | Descrição |
|---|---|
| `Nota` | Boletim por trimestre: NM1–3, RPT, MT, MTF por T1/T2/T3 + MA, PF, MAF, RCF, TGF, RF (status: CUR/AP/RE/DE/FA/AB/TR/CA/TT/TO). Unique por (aluno, disciplina, turma, professor, ano_letivo) |
| `Frequencia` | Presença/falta por aula (unique por aluno+disciplina+turma+professor+data) |
| `Aula` | Registro de aula (disciplina, professor, turma, data, assunto, estratégia) |
| `EstudoProgramado` | Lista de estudos do aluno |

### 6.4 Conteúdo pedagógico

| Model | Descrição |
|---|---|
| `Conteudo` | Material publicado (arquivo, título, descrição, data) |
| `Atividade` | Atividade com prazo e arquivo |
| `AtividadeQuestao` / `AtividadeAlternativa` | Questões e alternativas de atividade |
| `AtividadeEnvio` | Envio do aluno (arquivo, status, alteração solicitada) |
| `AtividadeResposta` | Respostas texto do aluno |
| `Avaliacao` | Prova: título, descrição, texto introdutório, data, turma (string), disciplina, ano_letivo |
| `Questao` | Questão hierárquica (`questao_pai`, `letra_subquestao`, `ordem`, `enunciado`, `tipo` OBJETIVA/SUBJETIVA, `imagem`, `linhas_resposta`) |
| `Alternativa` | Alternativa com flag `correta` (gabarito) |
| `AvaliacaoCorrecao` | Correção por aluno: foto do gabarito (`imagem`) + `nota` (unique por avaliação+aluno) |

### 6.5 Comunicação

| Model | Descrição |
|---|---|
| `Comunicado` | Aviso (autor: professor ou coordenador, turma opcional) |
| `Evento` | Evento do calendário (autor opcional, turma opcional) |
| `Advertencia` | Advertência/penalidade/suspensão com datas |
| `Conversa` / `MensagemChat` | Chat professor↔coordenação |
| `ConversaResponsavelProfessor`, `ConversaResponsavelCoordenador` + `MensagemChat*` | Chats do responsável |
| `VinculoResponsavel` | Vínculo responsável↔aluno |

### 6.6 Blog

`Post`, `Comentario`, `Curtida`, `PerfilBlog` — publicações com markdown, comentários e curtidas.

---
