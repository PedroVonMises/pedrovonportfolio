export const CLIPPY_SCRIPT = {
  welcome: {
    message: "Opa! Que bom que você chegou até aqui. Quer marcar um papo rápido de 20 min com o Pedro?",
    options: [
      { title: "Bora marcar!", next: "schedule_accept", outcome: "accepted" },
      { title: "Agora não", next: "confirm_decline" },
    ],
  },

  confirm_decline: {
    variants: [
      {
        anim: "recoil",
        message: "Opa, espera aí... <strong>tem certeza mesmo?</strong> São só 20 minutos para tirar sua ideia do papel.",
        options: [
          { title: "Pensando bem, bora!", next: "schedule_accept", outcome: "accepted" },
          { title: "Tenho certeza", nextPool: "post_decline_pool", outcome: "declined" },
        ],
      },
      {
        anim: "recoil",
        message: "Sério? Nem um café virtual sem compromisso? <strong>Tem certeza?</strong>",
        options: [
          { title: "Tá, me convenceu", next: "schedule_accept", outcome: "accepted" },
          { title: "Sim, sem call hoje", nextPool: "post_decline_pool", outcome: "declined" },
        ],
      },
      {
        anim: "recoil",
        message: "Você vai mesmo recusar um clipe prateado tão educado? <strong>Tem certeza absoluta?</strong>",
        options: [
          { title: "Ok, quero conversar", next: "schedule_accept", outcome: "accepted" },
          { title: "Absoluta!", nextPool: "post_decline_pool", outcome: "declined" },
        ],
      },
      {
        anim: "recoil",
        message: "Última chance antes de eu fingir que não fiquei chateado... <strong>tem certeza?</strong>",
        options: [
          { title: "Vamos marcar então", next: "schedule_accept", outcome: "accepted" },
          { title: "Firme e forte, não", nextPool: "post_decline_pool", outcome: "declined" },
        ],
      },
    ],
  },

  schedule_accept: {
    anim: "wave",
    message: "Mandou bem! Manda um oi por email para combinarmos o melhor horário ou puxa outro assunto:",
    options: [
      {
        title: "Enviar email",
        href: "mailto:pedrocodetheworld@gmail.com?subject=Vamos%20conversar%20sobre%20um%20projeto",
      },
      { title: "Outro assunto", nextPool: "post_schedule_pool" },
    ],
  },

  pools: {
    post_decline_pool: [
      "post_dec_email",
      "post_dec_github",
      "post_dec_easter",
      "post_dec_linkedin",
      "post_dec_humor",
    ],
    post_schedule_pool: [
      "post_sched_github",
      "post_sched_switch",
      "post_sched_work",
    ],
  },

  post_dec_email: {
    message: "Tranquilo! Sem pressão de reunião. Prefere mandar um email direto para o Pedro?",
    options: [
      { title: "Enviar email", href: "mailto:pedrocodetheworld@gmail.com" },
      { title: "Outra sugestão", nextPool: "post_decline_pool" },
    ],
  },

  post_dec_github: {
    message: "Beleza! Se quiser ver código de verdade antes de conversar, dá uma olhada no Healthfolio e no Qual a boa? no GitHub.",
    options: [
      { title: "Ver GitHub", href: "https://github.com/PedroVonMises" },
      { title: "Mudar de ideia", next: "schedule_accept", outcome: "accepted" },
    ],
  },

  post_dec_easter: {
    message: "Sem problemas! Sabia que você pode arrastar os stickers lá em cima, rabiscar o quadro Win95 ou me chacoalhar até eu ficar tonto?",
    options: [
      { title: "Me conta outra", nextPool: "post_decline_pool" },
      { title: "Quero marcar mesmo", next: "schedule_accept", outcome: "accepted" },
    ],
  },

  post_dec_linkedin: {
    message: "Fechado! Pelo menos bora conectar no LinkedIn para acompanhar os próximos projetos?",
    options: [
      { title: "Abrir LinkedIn", href: "https://www.linkedin.com/in/pedro-augusto-programador/" },
      { title: "Outra opção", nextPool: "post_decline_pool" },
    ],
  },

  post_dec_humor: {
    message: "Beleza, fico aqui no meu canto observando seu cursor... Se mudar de ideia, é só chamar!",
    options: [
      { title: "Mudei de ideia!", next: "schedule_accept", outcome: "accepted" },
      { title: "Até mais!", action: "close" },
    ],
  },

  post_sched_github: {
    message: "Enquanto o papo não chega, quer explorar o código do Pedro no GitHub?",
    options: [
      { title: "Abrir GitHub", href: "https://github.com/PedroVonMises" },
      { title: "Ver outra dica", nextPool: "post_schedule_pool" },
    ],
  },

  post_sched_switch: {
    message: "Dica: no topo da página dá para clicar no botão de switch e inverter 'engenheiro que desenha' para 'designer que programa'.",
    options: [
      { title: "Massa! Outra dica", nextPool: "post_schedule_pool" },
      { title: "Fechar", action: "close" },
    ],
  },

  post_sched_work: {
    message: "Quer ver os projetos em detalhes antes da conversa? Confere a página de portfólio por aqui.",
    options: [
      { title: "Ver portfólio", href: "/pt/work/" },
      { title: "Mais uma!", nextPool: "post_schedule_pool" },
    ],
  },

  reactions: {
    poke: [
      "Ai!",
      "Ei, isso dói!",
      "Para com isso!",
      "PARA!",
      "O que eu te fiz?!",
      "CHEGAAAA!",
    ],
    dizzy: [
      "Fiquei tonto...",
      "Tá tudo girando em 60fps!",
      "Ei, pega leve no mouse!",
    ],
  },
};
