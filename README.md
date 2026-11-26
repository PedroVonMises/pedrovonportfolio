# pedrovonportfolio

Portfolio e identidade pessoal de **Pedro Augusto** (`@PedroVonMises`), estudante de Sistemas de Informação (PUC Minas) e desenvolvedor Full-Stack em Vitória, ES.

> *"Portfolio de um engenheiro que desenha, e um designer que programa."*

## Destaques Técnicos

- **Zero dependências externas em produção**: site estático puro (~700 KB em `site/`), sem bundler ou etapa obrigatória de build.
- **HTML semântico e CSS nativo**: layout responsivo com tokens semânticos em `site/assets/css/main.css` e suporte a Bento grid.
- **13 módulos ES nativos (`site/assets/js/`)**: carregamento imediato do núcleo de UI e agendamento adiado (`requestIdleCallback`) para interações opcionais.
- **Assets otimizados e auto-hospedados**: fontes `.woff2`, ilustrações SVG otimizadas e imagens OpenGraph (`1200x630`) servidas localmente.

## Rotas Disponíveis

| Rota | Descrição |
| --- | --- |
| `/` | Redirecionamento automático para `/pt/` |
| `/pt/` | Home: Hero com alternador de tagline e stickers arrastáveis, apresentação, `#bridge-the-gap`, `#good-design` com canvas estilo Windows 95, Bento `1+2`, selos de projetos em produção, rodapé com cópia de e-mail e assistente Clippy interativo |
| `/pt/work/` | Portfólio com 5 projetos reais: `Healthfolio`, `Qual a boa?`, `Viva Bem na Estrada`, `VerseVision` e `InfoSocial` |
| `/pt/writing/` | Artigos técnicos sobre React, acessibilidade, dados e arquitetura web (em preparação) |
| `/pt/tools/` | Ferramentas open-source em desenvolvimento (em preparação) |
| `/cv` | Redirecionamento temporário para `/pt/#contact` enquanto o currículo em PDF é atualizado |

## Design System e Acessibilidade

- **Paleta WCAG AA/AAA definida em `:root`** (`site/assets/css/main.css`):
  - Marca: Burgundy (`#800020`) e Burgundy Profundo (`#590016`)
  - Acentos e destaque: Volt (`#CFFF04`), Verde Neon (`#39FF14`), Verde Floresta (`#0F6B00`), Menta Suave (`#EEFFE8`) e Champagne Mineral (`#F5E6C8`)
  - Neutros aquecidos: Fundo Claro (`#FCFBFA`) e Carvão Vinho (`#1C1618`)
- **Tipografia auto-hospedada (`.woff2`)**: `Cabinet Grotesk` (pesos `700` e `800`) para títulos, `Chivo` (`latin` e `latin-ext`) para corpo de texto e `JetBrains Mono` (`400` e `600`).
- **Acessibilidade**: `skip-link` para conteúdo principal, navegação por teclado com armadilha de foco no menu responsivo e modais, região `aria-live="polite"` para feedback de cópia de e-mail e respeito integral a `prefers-reduced-motion`.

## Interações e Módulos JS (`site/assets/js/`)

- `main.js`: bootstrap imediato do núcleo de UI e carregamento adiado (`requestIdleCallback`) de recursos opcionais e específicos por página.
- `core/`:
  - `scroll.js`: agendador único de rolagem com listener passivo e `requestAnimationFrame`
  - `reveal.js`: revelação de texto, linhas, selos e traços SVG via `IntersectionObserver`
  - `navigation.js`: barra fixa contextual e controle do menu responsivo com foco por teclado
  - `clipboard.js`: cópia de e-mail para a área de transferência com atualização de status acessível
  - `lightbox.js`: visualizador modal (`<dialog>`) para imagens ampliadas
  - `marquee.js`: cálculo de duração, clonagem contínua e ressincronização por `ResizeObserver`
  - `parallax.js`: movimento por `[data-speed]` orientado ao centro da viewport
  - `cursor.js`: cursor customizado para dispositivos com ponteiro fino
  - `draggable.js`: stickers arrastáveis com inércia e suporte a setas do teclado
- `modules/` e `data/`:
  - `home.js`: alternador de frase no Hero (`.switch-button-wrap`) e canvas interativo `#windows-error`
  - `clippy.js` e `data/clippy-script.js`: assistente interativo clássico em pt-BR com animações SVG por poses, arraste persistido e diálogos ramificados

## Estrutura do Repositório

```text
.
├── package.json
├── README.md
├── scripts/
│   └── dev-server.mjs
└── site/
    ├── apple-touch-icon.png
    ├── favicon.svg
    ├── index.html
    ├── cv/
    │   └── index.html
    ├── pt/
    │   ├── index.html
    │   ├── tools/
    │   │   └── index.html
    │   ├── work/
    │   │   └── index.html
    │   └── writing/
    │       └── index.html
    └── assets/
        ├── css/
        │   └── main.css
        ├── fonts/
        ├── js/
        │   ├── main.js
        │   ├── core/
        │   ├── data/
        │   └── modules/
        ├── og/
        └── svg/
```

## Como Rodar Localmente

Requisito: **Node.js 18+** (sem necessidade de `npm install`).

```powershell
npm run dev
```

O servidor estático local inicia em `http://127.0.0.1:4173/pt/`. Caso queira alterar porta ou host, defina as variáveis opcionais `PORT` e `HOST` antes de executar `npm run dev` ou `npm start`.

## Deploy Estático

Como não há etapa de build, basta publicar diretamente o conteúdo da pasta `site/` em provedores estáticos como **Vercel**, **Cloudflare Pages**, **Netlify** ou **GitHub Pages** (definindo `site` como Root / Output Directory).

## Contato

- **E-mail**: `pedrocodetheworld@gmail.com`
- **GitHub**: [PedroVonMises](https://github.com/PedroVonMises)
- **LinkedIn**: [pedro-augusto-programador](https://www.linkedin.com/in/pedro-augusto-programador/)
- **Instagram**: [@pedrovon.png](https://www.instagram.com/pedrovon.png/)
- **YouTube**: [Canal no YouTube](https://www.youtube.com/channel/UCnTT4xOUEmc8boiuiptxPsw)
