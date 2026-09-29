# Relatório de Notas — Filial 15

PWA mobile-first para reunir notas recebidas e gerar PDF. Next.js, React e TypeScript, com exportação estática. Sem login, backend, banco remoto ou envio de fotografias.

## Executar

Requisito: Node.js 24 LTS e npm.

```sh
npm ci
npm run dev
```

Abra http://localhost:3000. O desenvolvimento não registra service worker.

Para testar a versão de produção e o modo offline:

```sh
npm run build
npm run preview
```

Abra http://127.0.0.1:4173. Aguarde a mensagem de preparação offline. O cache do OCR é separado; os dados de idioma e motor representam aproximadamente 45 MB de download inicial. A interface informa quando a leitura também está disponível sem rede.

## Usar no celular

Publique o conteúdo de `out/` em uma hospedagem estática HTTPS, na raiz do domínio. A V1 não exige servidor Node em produção. Abra a URL no Chrome Android e use **Instalar aplicativo** ou a opção de instalação do navegador. A pasta `out/` inclui os recursos OCR e o service worker gerado no build.

O servidor de prévia está limitado a este computador. `localhost` no celular aponta para o próprio celular; para instalar e testar com câmera real, use a implantação HTTPS.

## Funcionalidades

- Câmera ou galeria e OCR Tesseract local em português.
- Extração conservadora de fornecedor, número e emissão, seguida de conferência editável.
- Recebimento baseado na data local do aparelho.
- Cadastro manual, edição, confirmação de exclusão e alerta de duplicidade com opção de exceção.
- IndexedDB para notas de vários dias, preservadas ao fechar o navegador.
- PDF A4 com quatro colunas, agrupamento por fornecedor/emissão/recebimento e múltiplas páginas.
- Visualização, download, compartilhamento de arquivos quando suportado e impressão.
- PDF desatualizado sinalizado após alteração; limpar PDF não remove notas.
- Zerar relatório com confirmação forte.
- PWA instalável; cadastro, edição, exclusão, PDF e OCR disponíveis offline após preparação dos respectivos recursos.

## Limites e privacidade

As fotografias são processadas em um worker local, sem upload, e não são salvas. A imagem preparada, o canvas e o worker são liberados após a leitura. O parser só retorna os três campos solicitados. As notas nunca são apagadas automaticamente, por geração de PDF ou por mudança de data.

Limpar os dados do site, usar sessão privada ou perder o armazenamento do navegador pode remover registros. A aplicação solicita persistência quando suportada, mas o navegador decide se a concede. Não existe sincronização entre aparelhos nem cópia remota.

O PDF atual fica em memória; depois de reabrir, gere novamente. Um metadado mantém a revisão da última geração, sem armazenar histórico de arquivos. Limpar PDF não remove downloads feitos pelo usuário.

O OCR não garante leitura correta de fotos desfocadas, reflexos ou layouts ambíguos. Campos não identificados ficam vazios. Há cancelamento e limite de dois minutos; falhas levam ao cadastro manual.

O compartilhamento só aparece se `navigator.canShare` aceitar PDF. A visualização usa o leitor do aparelho. A impressão utiliza uma tabela com o mesmo retrato dos registros que originou o PDF; a paginação do diálogo de impressão pode diferir. Também é possível abrir o PDF e imprimir pelo leitor. A validação automatizada usa Chrome desktop com viewport mobile; câmera física, instalação e impressão/compartilhamento Android ainda precisam de validação em aparelho real.

## Verificações

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Os testes de ponta a ponta usam Chrome instalado, com perfil temporário isolado e dados sintéticos. A configuração inicia a prévia de produção automaticamente. Execute `npm run build` antes. Nunca usam notas reais do navegador do usuário.

Cobertura: parser (incluindo ambiguidades), duplicidade, datas inválidas, persistência, agrupamento, relatórios extensos, limpeza de PDF, zerar relatório, geração do service worker, fluxo CRUD offline, PDF offline, OCR real offline, falha de imagem e larguras de 320/390/768 px.

## Organização

- `src/features/notes`: regras, formulários e estado das notas.
- `src/storage`: repositório IndexedDB e metadados transacionais.
- `src/features/ocr`: captura, preparação, contrato OcrProvider, Tesseract e parser separados.
- `src/features/pdf`: agrupamento, geração, impressão e referência temporária do PDF.
- `src/config/suppliers.ts`: lista inicial de fornecedores; não limita o preenchimento manual.
- `src/components`: controles compartilhados e instalação da PWA.
- `scripts`: preparo dos recursos OCR, geração de cache e prévia estática.
- `tests`: testes unitários, de integração e de ponta a ponta.

## Etapas concluídas

As nove etapas aprovadas foram implementadas em sequência, com testes, lint e build entre etapas. Os números e resultados finais estão em `VALIDACAO.md`.

## Publicação no GitHub Pages

Repositório: https://github.com/gilsonbs/relatorio_notas

Endereço: https://gilsonbs.github.io/relatorio_notas/

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. O workflow `.github/workflows/pages.yml` valida o projeto, executa o teste offline no Chromium e publica `out/` após cada envio para `main`.

A variável de build `NEXT_PUBLIC_BASE_PATH=/relatorio_notas` adapta todos os recursos, manifest e service worker ao subdiretório. Não publique o build padrão da raiz nesse endereço.

Para reproduzir a publicação no PowerShell:

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/relatorio_notas'
$env:PORT = '4174'
npm run build
npm run test:e2e
npm run preview
```

Abra http://127.0.0.1:4174/relatorio_notas/. Ao terminar, remova as variáveis dessa sessão para voltar ao build local da raiz. As notas salvas na prévia local não são transferidas para o endereço público nem entre aparelhos.
