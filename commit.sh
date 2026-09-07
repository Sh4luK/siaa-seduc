#!/bin/bash
# commit-um-por-um.sh
#
# Faz um commit SEPARADO para cada arquivo modificado, novo ou removido
# no repositório git atual. Útil quando você quer um histórico granular
# em vez de um único commit gigante com tudo junto.
#
# Uso:
#   ./commit-um-por-um.sh
#   ./commit-um-por-um.sh "prefixo da mensagem"
#
# Se não passar um prefixo, cada commit usa a mensagem padrão
# "update: <caminho_do_arquivo>".

set -e

PREFIXO="${1:-update}"

# Garante que estamos dentro de um repositório git
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Erro: este diretório não é um repositório git."
  exit 1
fi

# Lista todos os arquivos com alteração: modificados, novos (untracked) e removidos.
# --porcelain dá uma saída estável pra parsear.
ARQUIVOS=$(git status --porcelain | awk '{ $1=""; print substr($0,2) }')

if [ -z "$ARQUIVOS" ]; then
  echo "Nada para commitar — working tree limpa."
  exit 0
fi

TOTAL=$(echo "$ARQUIVOS" | wc -l)
ATUAL=0

echo "Encontrados $TOTAL arquivo(s) alterado(s). Commitando um por um..."
echo ""

while IFS= read -r ARQUIVO; do
  ATUAL=$((ATUAL + 1))

  # Ignora linhas vazias
  [ -z "$ARQUIVO" ] && continue

  # Trata o caso de arquivos renomeados: "antigo -> novo"
  if [[ "$ARQUIVO" == *" -> "* ]]; then
    ARQUIVO_DESTINO="${ARQUIVO#*-> }"
  else
    ARQUIVO_DESTINO="$ARQUIVO"
  fi

  echo "[$ATUAL/$TOTAL] Commitando: $ARQUIVO_DESTINO"

  git add -- "$ARQUIVO_DESTINO"

  # Se o add não resultou em nada staged (ex: arquivo já removido do disco
  # e do índice ao mesmo tempo), pula pra evitar commit vazio quebrando o script.
  if git diff --cached --quiet -- "$ARQUIVO_DESTINO"; then
    echo "   (sem mudanças staged, pulando)"
    continue
  fi

  git commit -m "${PREFIXO}: ${ARQUIVO_DESTINO}" --quiet
  echo "   -> commit criado."
  echo ""
done <<< "$ARQUIVOS"

echo "Concluído: $ATUAL arquivo(s) processado(s)."