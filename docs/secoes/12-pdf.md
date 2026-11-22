## 12. Geração de PDF
- Engine: **xhtml2pdf (Pisa)** — HTML+CSS → PDF.
- Templates Django em `app/templates/avaliacoes/`:
  - `pdf.html` — prova completa: cabeçalho, dados da avaliação, questões hierárquicas, linhas de resposta, imagens e **gabarito tabular com círculos CSS** (`border`+`border-radius`, pois a Helvetica não tem glifo de círculo).
  - `pdf_folha.html` — folha de respostas alternativa.
- Restrições do Pisa contornadas: sem `linear-gradient`, sem `@page :first`, pseudo-elementos decorativos removidos, margens 0.5cm.
- Logos SIAA/SEDUC embutidos via `file://` a partir de `BASE_DIR/app/static/`.

---
