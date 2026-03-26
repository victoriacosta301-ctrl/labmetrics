# Labmetrics - Sistema de Gestão de Produtividade

O **Labmetrics** é uma aplicação completa e moderna (construída em Next.js 15, React e Supabase) designada para facilitar o acompanhamento, gamificação e gestão financeira de equipes laboratoriais e de atendimento.

## 🚀 Funcionalidades Atuais

### 📊 Dashboard Analítico (MeuIA)
- Visão agregada do faturamento e da produtividade diária, semanal e mensal da organização.
- Tabelas interativas e Rankings gamificados comparando os top 5 colaboradores.
- Calculadoras de coeficiente percentual baseadas nas metas configuradas do banco.
- Exportação inteligente de Relatório Mensal simplificado para PDF (suporta visualização modular por meta).

### 🎯 Controle de Produtividade
- Monitoramento de pontos de Atendimento e Coletas computados em tempo real sob filtro sazonal para cada colaborador.
- Design responsivo em grid com insígnias e troféus automáticos baseados no atingimento das metas visuais (Verde, Dourado e Cinza).
- Injeção, remoção manual e ajuste de pontos bônus sobre os registros históricos através da reatividade global (`mReg` e `mEC`).
- Extrato e log detalhado por atendente filtrados por visualização de cronograma.

### 💳 Gestão de Faturamento
- Sistema tabular de *ledger* listando transações financeiras agrupadas progressivamente.
- Gerenciamento reativo de Metas de Faturamento escaláveis atreladas aos Setores.

### ⚙️ Centro de Configurações Administrativas
- **Controle Setorial:** Criação, vinculação nominal e deleção de setores autônomos da matriz.
- **Time/Colaboradores:** Gerenciamento centralizado de acessos (usuário/senha, com controle mestre de cargos `sup`) e realocação nos agrupamentos intersetoriais.
- **Metas Dinâmicas Universais e Isoladas:** Configuração granular de exigências via modal inteligente, segmentadas globalmente (*Meta Máxima e Meta Média*) ou pontualmente por Setor e Cargos específicos.  
- **Módulo Tático de Backup (Completo):** Uma camada nativa injetada que consolida todo o espelho do React Context (tabelas cruciais, usuários e valores das constelações modais), gerando imediatamente um arquivo local de resgate em formato cru (`JSONBlob`).

---

## 🚧 Sprint 2: Continuação do Desenvolvimento (Passo a Passo)

A base estrutural (`Phase 4`) do sistema encerrou sua fundação de migração e provou eficácia de renderização sob os testes. O próximo passo tange uma evolução arquitetural puramente Backend (`Phase 5` e `Phase 6`) desenhadas no **Gateway Socrático** ("Implementation Plan") pelos Agentes.

As etapas a seguir representam o que é estritamente necessário para instanciar o **Histórico Inteligente Mensal** sem regredir a base atual do projeto:

### 1. Configurando a Lógica no Banco (Tabela Nova)
A infraestrutura original atua lendo o "Agora". Precisamos arquivar um congelamento dos dados via snapshot à parte.
- Vá no **Supabase SQL Editor** e execute as instruções do script autogerado nos artefatos (`historico_metas.sql`) para criar a tabela de histórico sem alterar seus dados cruciais.
  - A tabela armazenará: Mês (`ano_mes`), ID de Setor (opcional), e as 12 colunas dimensionais numéricas (`xd`, `md`, `xpd`, etc).

### 2. Edificando o Fechamento Funcional (Frontend React)
Uma ferramenta para processar o encerramento do mês, gerar sugestão analítica baseada no desempenho retroativo (+10% base, permitindo customização) e arquivar os totais alcançados.
- Em `src/components/Settings.tsx` (sob o escopo principal, talvez próximo à guia de Setores ou Backup): Instanciar a chamada `openModal('mCloseMonth')`.
- No componente hub de popups (`src/components/Modals.tsx`), construir as tags do formulário `ModalCloseMonth` interligando os dados de fechamento via função `handleCloseMonth()` usando cliente local instanciado do módulo `@supabase/supabase-js`. As antigas metas globais preencherão a requisição POST para a nova tabela e sobrescreverão o presente `config`.

### 3. Conexão do Contexto Temporal (Arquitetura e Hooks)
Todos os algoritmos que decidem medalhas e pontos dependem disto. Ao olhar uma página sobre fevereiro num banco já transicionado para março, o sistema deve saber "puxar" os multiplicadores guardados de fevereiro.
- Modificar o arquivo vital da interface `src/lib/utils.ts`. 
- Os motores base, `cfgOf(uid)` e `calcPts(uid)`, devem passar a consumir uma injeção de data temporal (`targetDate` ou string `yyyy-mm`) nos parâmetros ao serem invocados através os Hooks.
- A função vai pesquisar primariamente os snapshots retidos no vetor unificado do `DataContext`. Se um snapshot existir para aquele mês temporal, a engrenagem usará estes campos multiplicadores; Se não encontrar, ou prever falha de compatibilidade, ele utilizará pacificamente o fallback contemporâneo da Array `config` central atual.
