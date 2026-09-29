# Validação da V1

Data: 29/09/2026.

## Resultado final

- 42 testes unitários e de integração aprovados (`npm test`).
- 4 testes de ponta a ponta aprovados (`npm run test:e2e`).
- ESLint aprovado (`npm run lint`).
- TypeScript aprovado (`npm run typecheck`).
- Build estático e geração do service worker aprovados (`npm run build`).
- PDF sintético renderizado com Poppler e inspecionado visualmente: título, cabeçalhos, quatro colunas, datas e paginação legíveis.
- Interface inspecionada em 390 px; teste de ausência de transbordamento em 320, 390 e 768 px.

## Sequência de implementação

Cada etapa teve testes, lint e build concluídos antes da próxima:

1. Estrutura Next.js/TypeScript e interface mobile.
2. Modelo e armazenamento local transacional.
3. Cadastro manual, edição, exclusão, duplicidade e zerar relatório.
4. PDF e ações associadas, com metadados de revisão.
5. Câmera e galeria.
6. OCR local com cancelamento, progresso e descarte da imagem.
7. Parser e lista de fornecedores separados.
8. Manifest, ícones, instalação e cache offline.
9. Fluxos completos, revisão visual, ajustes e documentação.

## Evidências dos testes de ponta a ponta

Os testes rodam no Chrome desktop em perfil isolado, com dados sintéticos e viewport mobile. A opção offline do contexto foi ativada após a preparação do service worker.

1. Cadastro manual, recarga da aplicação, preservação das datas de recebimento, geração e download de PDF offline, edição, aviso de PDF desatualizado, limpeza de PDF sem perda de notas, duplicidade (cancelar e aceitar), exclusão individual (cancelar e confirmar) e zerar relatório (cancelar e confirmar).
2. Leitura real da imagem sintética pelo Tesseract offline: PROFARMA, 416722 e 21/09/2026 identificados. Nenhuma requisição HTTP externa observada pela página.
3. Imagem inválida permite continuar com preenchimento manual.
4. Interface e formulário sem transbordamento horizontal nas larguras verificadas.

## Limites da validação

Não houve teste físico de câmera, instalação, compartilhamento nativo ou impressão em smartphone Android. Esses pontos dependem do aparelho e devem ser conferidos em implantação HTTPS. A qualidade do OCR foi verificada com imagem sintética legível, não com uma amostra de notas reais fotografadas. Não se afirma precisão universal do OCR.

A revisão visual de PDF utilizou o exemplo de duas notas gerado pelo fluxo. Os testes unitários também geraram 150 fornecedores e uma linha agrupada com 900 números para verificar paginação automática.

Nenhuma hospedagem pública foi criada. A entrega contém o código, os testes, a exportação `out/` e a prévia local.
## Preparação para GitHub Pages

Build validado com `NEXT_PUBLIC_BASE_PATH=/relatorio_notas`: 42 testes unitários/integração e 4 testes de ponta a ponta aprovados, além de lint e build. Os testes de OCR e PDF offline foram repetidos nesse subdiretório. Manifest, ícones, recursos OCR, service worker e cache usam o prefixo de publicação. Workflow criado para validação e publicação automática da branch `main`.
