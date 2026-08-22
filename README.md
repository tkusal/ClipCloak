# ClipCloak 🛡️

*[Read in English](#english)* | *[Leia em Português](#portugues)*

---

<a name="english"></a>
## English

**"Never accidentally paste secrets into AI again — especially while vibe coding."**

ClipCloak is a 100% open-source, local-first security layer designed to detect and redact sensitive data (API keys, credentials, PII, etc.) BEFORE they are pasted into AI chats or read by AI coding agents like Claude Code, Cursor, or Windsurf.

### The Problem It Solves
Developers often accidentally expose sensitive information when using AI tools. This happens either by manually copy-pasting secrets into a prompt, or when an AI agent automatically reads files like `.env`, logs, or configuration files containing credentials and sends them as context to a language model.

### Threat Model & Limitations
**ClipCloak mitigates:**
- API keys, JWTs, and tokens accidentally copied to prompts.
- Private keys and connection strings present in files read by AI agents.
- PII (Personally Identifiable Information) and financial data.
- Secrets accidentally added to Git commits (via CLI/pre-commit).

**ClipCloak DOES NOT protect against:**
- Malware on your machine or malicious browser extensions.
- OS compromise.
- AI Agents that deliberately bypass ClipCloak's hooks.
- Users who intentionally ignore warnings.
- *ClipCloak is an additional layer of prevention against accidental exposure, not a silver bullet DLP solution.*

### Privacy Principles (Non-negotiable)
- **100% Local:** No network calls whatsoever. No `fetch`, no WebSockets.
- **Zero Telemetry:** No tracking, no external logging.
- **No Secret Storage:** Detected secrets are never saved to disk or logged. They exist only in memory during redaction.

### Project Structure (Architecture)
The project is built as a modular monorepo using TypeScript and `pnpm workspaces`:
- `packages/core`: The main detection engine. It contains no hardcoded regional rules.
- `packages/pack-generic`: Detects generic secrets (AWS keys, OpenAI keys, CC, emails, IPs).
- `packages/pack-br`: Detects Brazilian PII (CPF, CNPJ, PIX).
- `packages/pack-eu`: Detects European PII (IBAN, VAT).
- `apps/cli`: Command Line Interface for on-demand scanning.
- `integrations/claude-code`: Native hook for Claude Code to block sensitive file reads.

### How to Install & Use
*(CLI MVP in development)*
```bash
# Scan a specific file
clipcloak scan .env

# Scan a directory
clipcloak scan src/

# Scan staged files before a commit
clipcloak scan --staged
```

### Contributing
We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
**To create a new pack:** Create a new folder under `packages/` (e.g., `pack-uk`), implement the `DetectorPack` interface, and add your deterministic validators. We prioritize deterministic validation over simple Regex to avoid false positives.

---

<a name="portugues"></a>
## Português

**"Nunca mais vaze segredos acidentalmente para a IA — especialmente durante o vibe coding."**

O ClipCloak é uma camada de segurança 100% open-source e executada localmente, desenvolvida para detectar e ofuscar dados sensíveis (chaves de API, credenciais, PII, etc.) ANTES que eles sejam colados em chats de IA ou lidos por agentes de código como Claude Code, Cursor ou Windsurf.

### O Problema que Resolve
Desenvolvedores frequentemente expõem acidentalmente informações sensíveis ao usar ferramentas de IA. Isso ocorre seja copiando e colando segredos manualmente em um prompt, ou quando um agente de IA lê automaticamente arquivos como `.env`, logs ou arquivos de configuração e os envia como contexto para um modelo de linguagem.

### Modelo de Ameaça e Limitações
**O ClipCloak mitiga:**
- Chaves de API, JWTs e tokens copiados acidentalmente.
- Chaves privadas e connection strings lidas por agentes de IA.
- PII (Informações Pessoais Identificáveis) e dados financeiros.
- Segredos adicionados acidentalmente em commits do Git.

**O ClipCloak NÃO protege contra:**
- Malware na sua máquina ou extensões de navegador maliciosas.
- Comprometimento do Sistema Operacional.
- Agentes de IA que ignorem deliberadamente os hooks do ClipCloak.
- Usuários que intencionalmente ignorem um alerta.
- *O ClipCloak é uma camada adicional de prevenção contra exposição acidental, e não uma solução completa de DLP infalível.*

### Princípios de Privacidade (Inegociáveis)
- **100% Local:** Nenhuma chamada de rede. Sem `fetch`, sem WebSockets.
- **Zero Telemetria:** Sem rastreamento, sem logs externos.
- **Nenhum Armazenamento de Segredos:** Segredos detectados nunca são salvos em disco ou logados. Eles existem apenas em memória durante a ofuscação.

### Estrutura do Projeto (Arquitetura)
O projeto é construído como um monorepo modular usando TypeScript e `pnpm workspaces`:
- `packages/core`: O motor principal de detecção. Não contém regras regionais hardcoded.
- `packages/pack-generic`: Segredos genéricos (chaves AWS, chaves OpenAI, CC, e-mails, IPs).
- `packages/pack-br`: PII brasileiro (CPF, CNPJ, PIX).
- `packages/pack-eu`: PII europeu (IBAN, VAT).
- `apps/cli`: CLI para escaneamento sob demanda.
- `integrations/claude-code`: Hook nativo para o Claude Code bloquear a leitura de arquivos sensíveis.

### Como Instalar e Usar
*(MVP da CLI em desenvolvimento)*
```bash
# Escanear um arquivo específico
clipcloak scan .env

# Escanear um diretório
clipcloak scan src/

# Escanear arquivos staged antes do commit
clipcloak scan --staged
```

### Contribuindo
Aceitamos contribuições! Veja nosso [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes.
**Como criar um novo pacote:** Crie uma nova pasta em `packages/` (ex: `pack-uk`), implemente a interface `DetectorPack` e adicione seus validadores determinísticos. Priorizamos validação matemática/determinística sobre Regex simples para evitar falsos positivos.
