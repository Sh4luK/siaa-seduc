#!/bin/bash

set -e

PREFIXO="${1:-update}"


if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Erro: este diretório não é um repositório git."
  exit 1
fi


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


  [ -z "$ARQUIVO" ] && continue

  if [[ "$ARQUIVO" == *" -> "* ]]; then
    ARQUIVO_DESTINO="${ARQUIVO#*-> }"
  else
    ARQUIVO_DESTINO="$ARQUIVO"
  fi

  echo "[$ATUAL/$TOTAL] Commitando: $ARQUIVO_DESTINO"

  git add -- "$ARQUIVO_DESTINO"


  if git diff --cached --quiet -- "$ARQUIVO_DESTINO"; then
    echo "   (sem mudanças staged, pulando)"
    continue
  fi

  git commit -m "${PREFIXO}: ${ARQUIVO_DESTINO}" --quiet
  echo "   -> commit criado."
  echo ""
done <<< "$ARQUIVOS"

echo "Concluído: $ATUAL arquivo(s) processado(s)."