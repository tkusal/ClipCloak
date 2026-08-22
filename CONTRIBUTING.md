# Contributing / Contribuindo

*[Read in English](#english)* | *[Leia em Português](#portugues)*

---

<a name="english"></a>
## English

Thank you for considering contributing to ClipCloak! This project is community-driven and we welcome all kinds of contributions, including bug reports, feature requests, documentation improvements, and code contributions.

### How to Contribute

1. **Bug Reports & Feature Requests**: Use the GitHub Issues tracker to report bugs or request features. Please search existing issues first to avoid duplicates.
2. **Code Contributions**:
   - Fork the repository.
   - Create a new branch (`git checkout -b feature/my-new-feature` or `git checkout -b fix/my-bug-fix`).
   - Make your changes. Ensure tests pass and test coverage is maintained.
   - Commit your changes with clear, descriptive messages.
   - Push to the branch (`git push origin feature/my-new-feature`).
   - Create a new Pull Request.

### Development Setup (Monorepo)

This project uses `pnpm` workspaces.

1. Install dependencies: `pnpm install`
2. Run tests: `pnpm test`
3. Run linter: `pnpm lint`
4. Build all packages: `pnpm build`

### Adding a New Regional Pack

We encourage adding new regional packs (e.g., `pack-uk`, `pack-de`).
1. Create a new folder under `packages/pack-[region]`.
2. Implement the `Pack` interface defined in `packages/core`.
3. Add unit tests for your detectors, including both positive and negative fixtures.
4. Ensure no ReDoS vulnerabilities exist in any regular expressions you add.

---

<a name="portugues"></a>
## Português

Obrigado por considerar contribuir para o ClipCloak! Este projeto é impulsionado pela comunidade e aceitamos todos os tipos de contribuições, incluindo relatos de bugs, solicitações de recursos, melhorias na documentação e contribuições de código.

### Como Contribuir

1. **Relatos de Bugs e Solicitações de Recursos**: Use o rastreador de Issues do GitHub para relatar bugs ou solicitar recursos. Por favor, pesquise issues existentes primeiro para evitar duplicatas.
2. **Contribuições de Código**:
   - Faça um Fork do repositório.
   - Crie uma nova branch (`git checkout -b feature/minha-nova-feature` ou `git checkout -b fix/minha-correcao-bug`).
   - Faça suas alterações. Certifique-se de que os testes passem e a cobertura de testes seja mantida.
   - Faça commit de suas alterações com mensagens claras e descritivas.
   - Envie para a branch (`git push origin feature/minha-nova-feature`).
   - Crie um novo Pull Request.

### Configuração de Desenvolvimento (Monorepo)

Este projeto utiliza workspaces do `pnpm`.

1. Instale as dependências: `pnpm install`
2. Rode os testes: `pnpm test`
3. Rode o linter: `pnpm lint`
4. Faça o build de todos os pacotes: `pnpm build`

### Adicionando um Novo Pacote Regional

Incentivamos a adição de novos pacotes regionais (ex: `pack-uk`, `pack-de`).
1. Crie uma nova pasta em `packages/pack-[regiao]`.
2. Implemente a interface `Pack` definida em `packages/core`.
3. Adicione testes unitários para seus detectores, incluindo fixtures positivas e negativas.
4. Certifique-se de que não existam vulnerabilidades ReDoS em nenhuma expressão regular que você adicionar.
