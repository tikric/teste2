# 📋 Prompt de Especificação e Engenharia do Projeto Bambuzau 3D (Ateliê 3D Hub)

Este documento descreve detalhadamente toda a arquitetura, conexões entre componentes, ferramentas integradas, fluxo de dados e o prompt de engenharia completo utilizado para conceber o sistema híbrido **Bambuzau 3D / Ateliê 3D Hub**. Use este arquivo para entender as ligações estruturais ou para recriar o projeto em qualquer ambiente.

---

## 🛠️ 1. O Prompt Híbrido Master (Prompt de Geração Conceitual)

Se você precisar recriar esta aplicação completa do zero ou alimentar outro modelo de IA, use o prompt estrutural abaixo:

```text
Crie uma aplicação híbrida de alta performance e visual ultra polido chamada "Bambuzau 3D / Ateliê 3D Hub" voltada para a gestão de ateliês de impressão 3D (vasos, action figures, protótipos industriais e peças de coleção). 

A aplicação deve ser estruturada como um sistema completo de duas partes integradas:

1. CLIENTE WEB (React 19 + TypeScript + Tailwind CSS de última geração + Lucide Icons + jsPDF para faturamento):
   - Deve ser offline-first com persistência automática de todo o estado em localStorage de forma segura contra falhas de parse de JSON.
   - Deve ter 7 abas funcionais em uma única tela de visual único com excelente contraste (Tema Dark Slate por padrão, customizável):
     a) DashboardTab: KPIs de faturamento bruto, margem líquida, quantidade de impressoras ativas, fila de produção e aviso visual baseado em auditoria de estoque atrasada (máximo de 3 dias recomendados).
     b) ProductionTab: Fila ativa de impressão 3D (modelo, fatiamento de camadas, tempo restante dinâmico, consumo de gramas estimado e cálculo de perda).
     c) ClientsTab: Cadastro de clientes com histórico de compras, status de fidelidade e botão para gerar mensagens diretas via WhatsApp.
     d) CostsTab: Painel com Calculadora de Formação de Preços inteligente (incorporando peso da peça, porcentagem de perda e suportes, horas de impressão, depreciação de máquina, energia elétrica, taxa fixa e percentual de marketplaces como Mercado Livre/Shopee, custo de embalagens/insumos e margem de lucro líquido desejada). Deve conter também Catálogo de Produtos e Lista de Compras de Insumos.
     e) IntegrationTab: Configurações de sincronização em nuvem via Firebase Realtime Database com possibilidade de rodar em modo Sandbox local se nenhuma URL for informada.
     f) SettingsTab: Configuração de identidade de marca (mudar nome do ateliê, tema visual primário, ícone principal) e exportação de backups.
     g) SoldTab: Histórico de faturamento acumulado com gráficos elegantes gerados via SVG puro ou Tailwind.
   - Deve incluir um banner flutuante superior para alertar caso exista uma versão APK de celular mais recente atualizada em um arquivo de configuração de banco remoto 'update_info.json'.

2. CONTÊINER ANDROID NATIVO (Kotlin + Jetpack Compose + Room Database + WebViewAssetLoader + Edge-to-Edge):
   - Um aplicativo complementar nativo em Kotlin que carrega o painel web acima localmente e de forma 100% offline através de um WebView com proteção de Sandbox.
   - Deve implementar o WebViewAssetLoader contendo um manipulador de caminhos para carregar páginas compiladas diretamente de 'assets' usando o domínio simulado seguro: 'https://appassets.androidplatform.net/assets/index.html'.
   - Interface WebView com JavascriptInterface injetada chamada 'AndroidInterface', permitindo que o Painel Web descubra dinamicamente a versão nativa compilada do APK sem truques de URL adicionando parâmetros.
   - Bloqueio de loops de recomposição mantendo a propriedade de carregamento de URL estável em um remember state do Compose.
   - Redirecionador automático de requisições de download do WebView para abrir no navegador padrão do Android (para facilitar atualização rápida baixando o APK atualizado).

3. SCRIPT DE AUTOMAÇÃO E CI/CD (GitHub Actions + tsx script de Assets):
   - Deve haver um workflow do GitHub Actions em '.github/workflows/android-apk.yml' que prepara um JDK 21 estável, instala e compila o React Web App (npm run build), ativa um script auxiliar (copy-assets.ts) que limpa o diretório 'assets' do Android e move fisicamente todas as páginas e pacotes compilados para o local correto no projeto Kotlin automático de forma sincronizada, e então roda './gradlew clean assembleDebug' para gerar o pacote APK final pronto para instalação em segundos.
```

---

## 🏗️ 2. Arquitetura Geral & Ligações Estruturais

A força do projeto reside na sincronia e modularidade entre as suas três camadas base:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SUITE DE AUTOMAÇÃO DE BUILD (Node.js)                │
│                                                                        │
│   ┌───────────────┐  npm run build  ┌───────────────┐ tsx copy-assets  │
│   │   Código-     ├────────────────►│  Web Assets   ├────────────────┐│
│   │ Fonte (React) │                 │  Compilados   │                ││
│   └───────────────┘                 └───────────────┘                ▼│
└──────────────────────────────────────────────────────────────┬─────────┘
                                                               │
┌──────────────────────────────────────────────────────────────┼─────────┐
│                   APLICATIVO ANDROID (Kotlin APK)            │         │
│                                                              ▼         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ app/src/main/assets/assets (Arquivos HTML/JS/CSS Internos)     │   │
│   └──────────────┬─────────────────────────────────────────────────┘   │
│                  │ (Carregado de forma offline-first estável)          │
│                  ▼                                                     │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Android WebView (Edge-to-Edge, sem barras de endereços)        │   │
│   │   - AndroidInterface (Injeção nativa Javascript: versão APK)   │   │
│   │   - WebViewAssetLoader (Filtro seguro de recursos internos)     │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│                                  ▼                                     │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Room Database & SQLite Local (Tabelas de Clientes e Fila)      │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 3. Especificação das Abas do Painel Web (React 19)

### `DashboardTab` (Painel Centralizador)
* **Função**: Reúne dados cruciais do negócio e da produção em cartões estilo bento de alta definição visual.
* **Ligações**:
  * Consome do estado global de `orders` para listar faturamento projetado de itens em andamento versus já faturados.
  * Consome do estado global de `printers` para controlar quais impressoras virtuais estão imprimindo naquele momento.
  * Alerta sobre a **Auditoria de Estoque Necessária**: se a diferença de tempo de `lastAuditDate` com o timestamp atual ultrapassar 3 dias, o banner fica vermelho e o usuário recebe um aviso severo instruindo a recontagem manual para evitar falta de insumos de fabricação.

### `ProductionTab` (Linha de Montagem de Camadas)
* **Função**: Controla o progresso de impressão das peças fatiadas.
* **Ferramentas**:
  * Formulário de faturamento e adição rápida de prints à fila.
  * Cálculo dinâmico de progresso com base na camada atual de impressão inserida sobre a quantidade de camadas totais de fatiamento.
  * Marcadores visuais rápidos e alertas de fatiamento inadequado.

### `ClientsTab` (CRM & Comunicação Direta)
* **Função**: Gestão de compradores e leads.
* **Conexões**:
  * Botão de comunicação integrada que abre automaticamente uma nova janela direcionando para o WhatsApp do cliente pré-configurado com uma mensagem automática detalhando o status atual da sua encomenda/impressão.

### `CostsTab` (O Cérebro Financeiro)
* **Função**: O módulo mais robusto para garantir a saúde financeira do ateliê.
* **Ferramentas Internas**:
  1. **Calculadora Precificadora Inteligente**: Através de uma fórmula de conversão de peso líquido, suportes e perda, fatora depreciação calculada da impressora, consumo elétrico calibrado por horas, horas de acabamento de mão-de-obra pós-processamento, tarifas de comissão e taxas fixas dos principais marketplaces (ex: Shopee/Mercado Livre/Site próprio), anúncios impulsionados em tráfego de vendas, e custo unitário de cada insumo físico adicional do estoque (como embalagens e fita de alta temperatura).
  2. **Catálogo Integrado**: Salva o produto resultante de fatiamento/precificação diretamente em um catálogo local faturável para vendas recorrentes rápidas.
  3. **Estoque de Filamentos**: Controle por gramas de carretel físico restante.
  4. **Estoque de Insumos/Consumíveis**: Controla frascos de cola de mesa, parafusos de montagem, caixas de envio de papelão e fitas adesivas.
  5. **Lista de Compras Própria**: Cria metas de compra com cálculo de soma total projetada.

### `IntegrationTab` (Sincronização em Nuvem)
* **Função**: Garante a segurança dos dados transferindo relatórios locais para a nuvem.
* **Ligações**:
  * Fornece campos para configurar a URL do Firebase Realtime Database e o Workspace Code correspondente.
  * Testa conexões em background enviando requisições REST otimizadas em formato de arquivos JSON.

### `SettingsTab` (Identidade e Personalização)
* **Função**: Permite a mudança integral da aparência do painel.
* **Ligações**:
  * Salva o estado principal de `brandConfig` mudando o logo da marca, o nome exibido nos cabeçalhos e a cor forte primária de forma totalmente reativa através de classes dinâmicas e variáveis de folha CSS root (`--brand-primary`).

### `SoldTab` (Livro-Caixa de Vendas)
* **Função**: Mostra análises mensais e métricas consolidadas em cartões gráficos sofisticados.

---

## 📦 4. Detalhamento do Aplicativo Android Nativo (Kotlin)

O contêiner Android foi programado sob padrões de alta eficiência para manter o painel web isolado e rodando com suavidade offline:

* **WebViewAssetLoader & AssetsPathHandler**: Intercepta as requisições de rede feitas pela WebView direcionadas a URLs de hosts específicos (ex: `https://appassets.androidplatform.net/assets/...`). Isso garante que os scripts que usam chamadas REST sintáticas ou imports do tipo ES Module continuem buscando recursos da pasta local segura do aplicativo `/app/src/main/assets` sem sofrer bloqueios severos de segurança Cross-Origin (CORS).
* **BackHandler**: O WebView intercepta o botão físico de voltar do Android chamando `canGoBack()` e `goBack()`, preservando a navegação de abas internas sem fechar o aplicativo abruptamente de forma inesperada.
* **Compatibilidade com JavascriptInterface**:
  ```kotlin
  class WebAppInterface(private val context: Context) {
      @android.webkit.JavascriptInterface
      fun getNativeVersion(): String {
          return BuildConfig.VERSION_NAME
      }
  }
  ```
  Isso expõe o método `window.AndroidInterface.getNativeVersion()` para a aplicação React. Desta forma, o painel web descobre logo ao ligar se o usuário está usando uma versão desatualizada do aplicativo de celular e exibe instantaneamente o painel sugerindo o download do novo instalador APK!
