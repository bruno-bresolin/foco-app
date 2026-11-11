# Manutenção do Foco

App Expo/React Native em TypeScript, interface em português. Leia
[docs/MANUTENCAO.md](docs/MANUTENCAO.md) antes de atualizar dependências.

## Mapa
- `src/app/`: telas e rotas; `src/components/`: componentes e formulários.
- `src/context/app.tsx`: estado global, persistência e ações.
- `src/lib/types.ts`: contrato dos dados; `dates.ts`: datas locais;
  `stats.ts`: métricas; `timer.ts`: máquina de estados pura.
- `src/lib/timerNotifications.ts`: fronteira JS/Android.
- `native/android/`: fontes nativas mantidas; `plugins/withFocoTimer.js`:
  instalação dessas fontes e registro do serviço no prebuild.
- `android/` e `ios/` são gerados e ignorados pelo Git. Correções permanentes
  devem ficar nas fontes nativas e/ou no config plugin.

## Regras para alterações
- Preserve alterações existentes do usuário; confira `git status` antes de editar.
- Para upgrades, consulte as notas oficiais do SDK de destino. Atualize um SDK
  por etapa e alinhe React/React Native com Expo; não use `react@latest`,
  `npm update` geral ou `--force`/`--legacy-peer-deps` para esconder conflitos.
- Preserve dados locais e backups. Alterar o esquema exige migração explícita
  e testes com dados da versão anterior, sem limpar o armazenamento.
- Datas de hábitos são locais (`YYYY-MM-DD`), domingo = 0. Hábitos de outros
  dias devem continuar acessíveis para edição e não contam no progresso de hoje.
- Timer usa `endsAt`, não decrementos como fonte de verdade. Reconciliação
  deve evitar duplicar sessões e crédito de foco. Mudanças no protocolo da
  notificação precisam acompanhar Kotlin e TypeScript.
- Mantenha regras de domínio em módulos puros quando possível e teste resultados
  observáveis. Não faça refatoração ampla junto com upgrade de dependências.

## Validação
- `npm run verify`: tipos, lint sem avisos e testes de lógica/plugin.
- `npm run deps:check`: compatibilidade com o SDK Expo instalado; pode usar rede.
- Esses comandos não substituem compilação Android/iOS nem teste de interface.
- Relate os comandos executados, resultados e verificações que ficaram pendentes.
