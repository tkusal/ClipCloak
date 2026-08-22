# ClipCloak 🛡️

*[Read in English](#english)* | *[Leia em Português](#portugues)*

---

<a name="english"></a>
## English

**"Never accidentally paste secrets into AI again — especially while vibe coding."**

ClipCloak is a 100% open-source, local-first tool designed to detect and redact sensitive data (API keys, PII, etc.) BEFORE they are pasted into AI chats or read by AI coding agents.

### Why ClipCloak?
- **100% Local:** No network calls, no telemetry, no tracking. Your data never leaves your machine.
- **Agent Hooks (Coming Soon):** Scans files *before* they are read as context by tools like Claude Code, Cursor, or Windsurf.
- **Pluggable Regional Packs:** Built with modularity in mind. Supports regional sensitive data out of the box (e.g., Brazilian CPF/PIX, European IBAN) alongside generic secrets (AWS keys, credit cards).
- **Free Forever:** MIT Licensed. Maintained by the community, for the community.

### Project Structure
- `packages/core`: The main detection engine.
- `packages/pack-generic`: Detects generic secrets (AWS keys, OpenAI keys, CC, emails, IPs).
- `packages/pack-br`: Detects Brazilian PII (CPF, CNPJ, PIX).
- `packages/pack-eu`: Detects European PII (IBAN, VAT).
- `apps/cli`: Command Line Interface for on-demand scanning.

### How to use
*(Coming soon - MVP in development)*

---

<a name="portugues"></a>
## Português

**"Nunca mais vaze segredos acidentalmente para a IA — especialmente durante o vibe coding."**

O ClipCloak é uma ferramenta 100% open-source e executada localmente, desenvolvida para detectar e ofuscar dados sensíveis (chaves de API, PII, etc.) ANTES que eles sejam colados em chats de IA ou lidos por agentes de código IA.

### Por que o ClipCloak?
- **100% Local:** Nenhuma chamada de rede, sem telemetria, sem rastreamento. Seus dados nunca saem da sua máquina.
- **Hooks para Agentes (Em breve):** Escaneia arquivos *antes* que eles sejam lidos como contexto por ferramentas como Claude Code, Cursor ou Windsurf.
- **Pacotes Regionais Conectáveis:** Arquitetura modular. Suporta nativamente dados sensíveis regionais (ex: CPF/PIX no Brasil, IBAN na Europa) junto com segredos genéricos (chaves da AWS, cartões de crédito).
- **Gratuito para Sempre:** Licença MIT. Mantido pela comunidade, para a comunidade.

### Estrutura do Projeto
- `packages/core`: O motor principal de detecção.
- `packages/pack-generic`: Detecta segredos genéricos (chaves AWS, chaves OpenAI, CC, e-mails, IPs).
- `packages/pack-br`: Detecta PII brasileiro (CPF, CNPJ, PIX).
- `packages/pack-eu`: Detecta PII europeu (IBAN, VAT).
- `apps/cli`: Interface de Linha de Comando para escaneamento sob demanda.

### Como usar
*(Em breve - MVP em desenvolvimento)*
