# Manutenção e atualizações com IA

## Avaliação do projeto

A manutenção assistida por IA é viável, com risco moderado nas atualizações da
plataforma. React ficar antigo, por si só, não impede corrigir funcionalidades.
O custo aumenta quando vários SDKs se acumulam, bibliotecas deixam de ser
compatíveis ou ferramentas de compilação deixam de suportar a base antiga.

Base observada em 10/11/2026: Expo `~58.0.23`, React `19.3.0`, React Native
`0.88.1`. Esses valores são um registro, não instrução para versões futuras;
`package.json` e `package-lock.json` são a referência executável.

Pontos favoráveis: TypeScript estrito, poucas telas, estado centralizado,
lockfile versionado, domínio do timer separado da UI e testes existentes.
Lacunas: não há testes automatizados de interface, compilação nativa não faz
parte do comando de validação e estatísticas/backup têm cobertura limitada.

| Área | Risco no upgrade | O que conferir |
| --- | --- | --- |
| React, React Native, Expo e Router | Alto se atualizados isoladamente | Matriz do SDK e notas de migração |
| Serviço Android do Pomodoro | Alto | Registro no prebuild, permissões, bridge e execução com tela bloqueada |
| Reanimated, Worklets, gestures e screens | Moderado/alto | Versões do SDK, build e navegação no aparelho |
| Expo UI, efeitos de vidro e símbolos | Moderado | APIs e suporte por plataforma |
| AsyncStorage, arquivos e compartilhamento | Moderado | Dados anteriores, importação e exportação |
| Datas, estatísticas e lógica de tarefas | Menor, com regressões possíveis | Testes de comportamento e fuso local |

## Rotina antes de mudar versões

1. Inspecione o estado do Git e mantenha a alteração isolada. Exporte um backup
   do app instalado e guarde o instalador anterior para recuperação.
2. Registre `node --version`, `npm --version` e as versões de Java/Android SDK
   (e Xcode no iOS). O ambiente observado foi Node 22.23.1/npm 10.9.8;
   confira os requisitos do SDK de destino antes de escolher o ambiente futuro.
3. Instale a base com `npm ci` em um checkout limpo e execute `npm run verify`.
4. Execute `npm run deps:check` e `npx expo-doctor`; registre problemas já existentes.
   Doctor pode ser baixado pelo npx e precisa de rede. Esses diagnósticos não são
   prova de funcionamento no aparelho.

## Sequência de atualização

1. Leia as notas oficiais do próximo SDK e determine uma versão explícita de
   Expo. Faça uma etapa por SDK; evite saltos grandes sem validar intermediários.
2. Instale a versão escolhida de Expo com `npm install expo@<versão-alvo>`
   (substitua o marcador pela versão real). Rode `npx expo install --fix` para
   alinhar as dependências suportadas. Esses comandos modificam manifesto/lockfile.
3. Adapte APIs removidas usando a documentação da versão alvo. Preserve o
   lockfile e revise seu diff; não apague o arquivo para esconder conflitos.
4. Execute `npm run deps:check`, `npx expo-doctor` e `npm run verify`.
5. Gere o projeto Android com `npx expo prebuild --platform android` em checkout
   isolado. Revise modificações manuais nas pastas geradas antes de qualquer
   prebuild com `--clean`, pois ele as recria. Valide o plugin e compile com
   `npm run android`. No iOS, gere/compile em macOS com ferramentas compatíveis.
6. Instale a nova build sobre a versão anterior, preservando os dados. Mudanças
   nativas exigem nova build: Expo Go e exportação web não validam o serviço Android.
7. Registre versões, alterações, comandos, resultados e limitações no resumo da
   atualização. Faça rollback do código por commit/branch se necessário; dados
   migrados precisam de estratégia própria de compatibilidade ou restauração.

## Roteiro de aceitação no aparelho

- Abrir a versão atualizada com dados antigos: tarefas, hábitos, histórico e ajustes.
- Criar/editar hábito de apenas um dia e de dois dias. Fora do dia programado,
  confirmar visibilidade e edição em “Hábitos de outros dias”; não somar ao
  progresso de hoje nem permitir marcação nesse grupo.
- Concluir/desmarcar hábito de hoje, conferir mini-histórico e progresso.
- Criar tarefa com prazo, concluir e vincular outra tarefa ao Pomodoro.
- Iniciar, pausar, retomar e pular foco; testar pausa curta/longa e início automático.
- Deixar foco terminar em segundo plano/tela bloqueada, reabrir e confirmar
  notificação, tempo e crédito de sessão sem duplicação. Testar reinício do app.
- Negar permissão de notificações: timer deve funcionar e explicar a ausência de aviso.
- Exportar backup e importar uma cópia em ambiente de teste; comparar os dados.
- Conferir navegação, teclado, modais e layout nas plataformas suportadas.

## Pedido reutilizável para uma IA

> Leia AGENTS.md e docs/MANUTENCAO.md. Avalie a atualização do SDK atual para
> [versão alvo], consulte fontes oficiais, identifique incompatibilidades e
> preserve dados e alterações locais. Implemente em etapas pequenas. Execute
> verify, diagnósticos de compatibilidade e as validações nativas disponíveis.
> Entregue o diff e diferencie testes automatizados, testes no aparelho e pendências.

## Referências oficiais

- [Atualizar Expo SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Atualizar React Native](https://reactnative.dev/docs/upgrading)
- [Expo Doctor e ferramentas](https://docs.expo.dev/develop/tools/)
