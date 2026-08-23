<div align="center">
  <h1>🛡️ ClipCloak</h1>
  <p><strong>Um escudo robusto para ajudar a prevenir o vazamento de segredos para desenvolvedores e agentes de IA.</strong></p>

  <p>
    <a href="https://github.com/tkusal/ClipCloak/actions"><img src="https://img.shields.io/github/actions/workflow/status/tkusal/ClipCloak/ci.yml?branch=main" alt="CI Status"></a>
    <a href="https://www.npmjs.com/package/@clipcloak/cli"><img src="https://img.shields.io/npm/v/@clipcloak/cli.svg" alt="NPM Version"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  </p>
  <p>
    <em>Read this in <a href="README.md">English</a></em>
  </p>
</div>

---

ClipCloak é um ecossistema ultra-rápido, offline e multiplataforma projetado para ajudar a detectar e bloquear dados sensíveis (chaves de API, senhas, credenciais, PII) *antes* que eles saiam da sua máquina.

Seja fazendo um commit, colando texto em um aplicativo não confiável ou deixando um agente autônomo de IA explorar seu sistema de arquivos, o ClipCloak ajuda a reduzir o risco de expor seus segredos ao mundo exterior.

## 🌟 Ecossistema

O ClipCloak é construído sobre um motor altamente modular e fornece ferramentas para cada fluxo de trabalho de desenvolvimento:

- **CLI (`@clipcloak/cli`)** *(Estável)*: Escaneie repositórios, use em CI/CD ou conecte-o ao Git.
- **Git Hook** *(Estável)*: Impeça commits contendo segredos (`clipcloak install git-hook`).
- **Integração de IA** *(Preview)*: Conecta-se aos hooks PreToolUse do Claude Code para bloquear a leitura de arquivos quando segredos são detectados, ajudando a garantir que você não vaze chaves de produção para servidores de IA.
- **VS Code Extension** *(Preview)*: Destaca segredos expostos diretamente na sua IDE enquanto você digita.
- **Desktop Daemon** *(Alpha)*: Um aplicativo Electron em segundo plano que monitora a área de transferência (clipboard) localmente, avisando-o e fornecendo um atalho de "Safe Paste" (`Ctrl+Shift+V`) para censura instantânea.

## 🚀 Início Rápido

### 1. Interface de Linha de Comando (CLI)
Instale globalmente ou rode via `npx`:

```bash
# Escaneie um arquivo ou pasta específica
npx @clipcloak/cli scan ./src

# Escaneie apenas os arquivos em "stage" no git
npx @clipcloak/cli scan --staged

# Instale o hook de pre-commit no seu repositório
npx @clipcloak/cli install git-hook
```

### 2. Proteção de Clipboard (Desktop)
1. Clone o repositório e faça o build do monorepo (`pnpm install && pnpm build`).
2. Inicie o daemon: `cd apps/desktop && pnpm start`.
3. Copie um segredo (ex: um GitHub PAT falso).
4. Veja a notificação nativa do SO! Pressione `Ctrl+Shift+V` para colar a versão segura em qualquer lugar.

### 3. Proteção para IA (Claude Code)
Proteja seu sistema de arquivos ao usar o Claude Code:
```bash
npx @clipcloak/cli install claude-code
```
*Adiciona uma camada local de proteção que pode bloquear operações suportadas de leitura de arquivo quando dados sensíveis são detectados.*

**Nota:** O ClipCloak reduz o risco de exposição; não é um sandbox ou garantia contra o vazamento de segredos.

## 🧠 O Motor

O ClipCloak utiliza um núcleo em Node.js altamente otimizado (`@clipcloak/core`). Ele evita a terrível "fadiga de falsos positivos" associada a scanners simples de RegEx usando:
- **Análise de Entropia de Shannon**: Distingue chaves de API verdadeiras (geradas aleatoriamente) de strings falsas como `EXAMPLE_KEY` ou `AKIAIOSFODNN7EXAMPLE`.
- **Pacotes Modulares**: Ative apenas os detectores que você precisa:
  - `@clipcloak/pack-generic`: AWS, GitHub, Stripe, JWTs, IPs, Emails, Cartões de Crédito.
  - `@clipcloak/pack-br`: Dados Brasileiros (CPF, CNPJ, Chaves Pix).
  - `@clipcloak/pack-eu`: Dados Europeus (IBAN, VAT).

## ⚙️ Configuração

Crie um arquivo `.clipcloak.json` na raiz do seu projeto:

```json
{
  "minSeverity": "medium",
  "minConfidence": 0.8,
  "packs": ["generic", "br"],
  "ignore": ["tests/fixtures/**", "*.md"]
}
```

## 🤝 Contribuindo

Acolhemos contribuições de todos! Veja nosso [Guia de Contribuição](CONTRIBUTING.md) para aprender como configurar o monorepo, rodar os testes e adicionar novos detectores sem vazar segredos reais acidentalmente.

Por favor, note que temos um [Código de Conduta](CODE_OF_CONDUCT.md). Ao participar deste projeto, você concorda em seguir suas regras.

## 📝 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
