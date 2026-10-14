const upper = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const m = {
  app: {
    name: "Contadinho",
    shortName: "Contadinho",
    newExpense: "Novo gasto",
    description:
      "Anote cada gasto em segundos e veja para onde foi cada real. Tudo contadinho.",
  },
  common: {
    back: "Voltar",
    close: "Fechar",
    save: "Salvar",
    saving: "Salvando…",
    loading: "Carregando…",
    create: "Criar",
    cancel: "Cancelar",
    skipToContent: "Pular para o conteúdo",
    tryAgain: "Não foi possível salvar. Tente de novo.",
  },
  nav: {
    label: "Navegação principal",
    home: "Início",
    transactions: "Transações",
    jars: "Cofrinhos",
    insights: "Análises",
    settings: "Ajustes",
    add: "Adicionar lançamento",
    newTransaction: "Novo lançamento",
  },
  home: {
    emptyTitle: "Nada contado ainda",
    emptyDescription:
      "Anote seu primeiro gasto e o Contadinho começa a contar com você.",
    emptyAction: "Anotar primeiro gasto",
    recent: "Últimos lançamentos",
    seeAll: "Ver todos",
    whereItWent: "Para onde foi",
    otherCategories: "Outras categorias",
    donutSummary: (name: string, percent: number) =>
      `Gráfico de pizza dos gastos do mês por categoria. A maior é ${name}, com ${percent}% do total.`,
    seeAnalysis: "Ver análises",
    limits: "Limites do mês",
  },
  analysis: {
    income: "Receitas",
    spentIn: (month: string) => `Gastos em ${month}`,
    lessThan: (amount: string, reference: string) =>
      `${amount} a menos que ${reference}`,
    moreThan: (amount: string, reference: string) =>
      `${amount} a mais que ${reference}`,
    sameAs: (reference: string) => `O mesmo que ${reference}`,
    samePeriodOf: (month: string) => `no mesmo período de ${month}`,
    inMonth: (month: string) => `em ${month}`,
    yourAverage: "a sua média",
    incomeIn: (month: string) => `Receitas em ${month}`,
    left: (amount: string) => `Sobrou ${amount}`,
    short: (amount: string) => `Saldo ${amount}`,
    trend: "Últimos 12 meses",
    trendUntil: (month: string) => `12 meses até ${month}`,
    categoryTitle: (name: string) => `${name} em Análises`,
    trendAverage: (amount: string) => `Média de ${amount} por mês`,
    trendNoAverage: "A média aparece depois do primeiro mês completo.",
    trendEmpty: "A tendência aparece a partir do 2º mês.",
    partial: "O mês atual ainda está em andamento e não entra na média.",
    bar: (month: string, amount: string, partial: boolean) =>
      `${month}: ${amount}${partial ? " (parcial)" : ""}`,
    noData: "sem dados",
    byCategory: "Por categoria",
    incomeByCategory: "Receitas por categoria",
    percent: (value: number) => `${value}%`,
    emptyMonth: (month: string) => `Nenhum gasto em ${month}.`,
    whereToSave: "Onde economizar",
    aboveNormal: (name: string) => `${name} acima do normal`,
    aboveNormalDetail: (spent: string, month: string, usual: string) =>
      `${spent} em ${month}, quando o normal é ${usual}`,
    topSpending: (month: string) => `Maiores gastos de ${month}`,
    times: (count: number) => `${count} vezes`,
    entriesIn: (month: string) => `Lançamentos de ${month}`,
    noEntries: (month: string) => `Nenhum lançamento em ${month}.`,
    limitOf: (spent: string, limit: string) => `${spent} de ${limit}`,
    limitLeft: (amount: string) => `Restam ${amount}`,
    limitOver: (amount: string) => `${amount} acima do limite`,
  },
  balance: {
    title: (month: string) => `Saldo de ${month}`,
    negative: "Gastou mais do que recebeu",
    positive: "Sobrou para guardar",
    income: "Receitas",
    expenses: "Gastos",
  },
  closing: {
    page: "Balanço",
    title: (month: string) => `Balanço de ${month}`,
    ended: (month: string) => `${upper(month)} terminou`,
    endedDetail: "Veja o balanço do mês e feche quando tudo estiver lançado.",
    seeReport: "Ver balanço",
    later: "Agora não",
    openState: "Aberto",
    closedState: "Fechado",
    better: (month: string, amount: string) =>
      `Melhor que ${month}: ${amount} a mais de saldo`,
    worse: (month: string, amount: string) =>
      `Pior que ${month}: ${amount} a menos de saldo`,
    same: (month: string) => `Mesmo saldo de ${month}`,
    figures: "Números do mês",
    savingsRate: "Taxa de economia",
    saved: (percent: number) => `Guardou ${percent}% do que recebeu`,
    overspent: (percent: number) => `Gastou ${percent}% a mais do que recebeu`,
    noIncome: "Sem receitas no mês",
    jars: "Cofrinhos",
    jarsIn: (amount: string) => `${amount} guardados`,
    jarsOut: (amount: string) => `${amount} retirados`,
    jarsNone: "Nada guardado",
    up: (month: string) => `Mais gastos que em ${month}`,
    down: (month: string) => `Menos gastos que em ${month}`,
    more: (amount: string) => `${amount} a mais`,
    less: (amount: string) => `${amount} a menos`,
    close: (month: string) => `Fechar ${month}`,
    closeHint:
      "Depois de fechado, o mês não aceita lançar, editar nem excluir. Dá para reabrir quando quiser.",
    closedOn: (date: string) => `Fechado em ${date}`,
    reopen: "Reabrir mês",
    closedToast: (month: string) => `${upper(month)} fechado`,
    reopenedToast: (month: string) => `${upper(month)} reaberto`,
    notOver: "O balanço pode ser fechado depois que o mês acaba.",
    locked: "Esse mês está fechado. Reabra o mês no balanço para mudar.",
    lockedNotice: "Mês fechado",
    lockedDetail: "Para mudar algo, reabra o mês no balanço.",
  },
  transactions: {
    balance: (amount: string) => `Saldo ${amount}`,
    emptyTitle: "Nenhum lançamento neste mês",
    emptyDescription:
      "Seus gastos e receitas aparecem aqui, agrupados por dia.",
    emptyAction: "Adicionar gasto",
    previousMonth: "Mês anterior",
    nextMonth: "Próximo mês",
    expenses: "Gastos",
    income: "Receitas",
    today: "Hoje",
    yesterday: "Ontem",
    dayTotal: "Total do dia",
    count: (n: number) => (n === 1 ? "1 lançamento" : `${n} lançamentos`),
    installment: (n: number, total: number) => `${n}/${total}`,
    truncated: (n: number) =>
      `Mostrando os ${n.toLocaleString("pt-BR")} lançamentos mais recentes.`,
    search: "Buscar lançamentos",
    searchPlaceholder: "Buscar em todos os meses",
    clearSearch: "Limpar busca",
    results: (n: number) => (n === 1 ? "1 resultado" : `${n} resultados`),
    kindFilter: "Tipo",
    categoryFilter: "Categoria",
    paymentFilter: "Pagamento",
    kinds: { expense: "Despesas", income: "Receitas" },
    archivedCategory: (name: string) => `${name} (arquivada)`,
    archivedCard: (name: string) => `${name} (arquivado)`,
    filters: "Filtros",
    clearFilters: "Limpar filtros",
    noResults: "Nenhum lançamento encontrado",
    noResultsHint: "Tente outra palavra ou mude os filtros.",
  },
  entry: {
    newTitle: "Novo lançamento",
    editTitle: "Editar lançamento",
    kind: "Tipo",
    expense: "Despesa",
    income: "Receita",
    amount: "Valor",
    description: "Descrição",
    descriptionPlaceholder: "Ex.: almoço, Uber, farmácia…",
    category: "Categoria",
    newCategory: "Nova categoria",
    noCategories: "Crie sua primeira categoria para este tipo.",
    payment: "Pagamento",
    newCard: "Novo cartão",
    date: "Data",
    otherDate: "Outra data",
    billPreview: (month: string, close: string, due: string) =>
      `Entra na fatura de ${month}, que fecha em ${close} e vence em ${due}.`,
    add: { expense: "Adicionar despesa", income: "Adicionar receita" },
    saveChanges: "Salvar alterações",
    saveAndNew: "Salvar e novo",
    saved: (kind: string, amount: string) => `${kind} de ${amount} salva`,
    delete: "Excluir lançamento",
    deleteAll: "Excluir todas as parcelas",
    deleted: "Lançamento excluído",
    undo: "Desfazer",
    restored: "Lançamento restaurado",
    installmentLocked:
      "Para mudar valor, data ou pagamento de uma compra parcelada, exclua e lance de novo.",
    amountRequired: "Informe um valor",
    categoryRequired: "Escolha uma categoria",
    paymentRequired: "Escolha como pagou",
    dateInvalid: "Escolha uma data entre 2000 e 2100",
    categoryAdded: (name: string) => `Categoria “${name}” criada e selecionada`,
    cardAdded: (name: string) => `Cartão “${name}” criado e selecionado`,
  },
  payments: { pix: "Pix", boleto: "Boleto", card: "Cartão" },
  settings: {
    categories: "Categorias",
    categoriesHint: "Crie e organize suas categorias",
    cards: "Cartões",
    cardsHint: "Seus cartões, com fatura opcional",
    expenseCategories: "Despesas",
    incomeCategories: "Receitas",
    newCategory: {
      expense: "Nova categoria de despesa",
      income: "Nova categoria de receita",
    },
    newCategoryPlaceholder: {
      expense: "Ex.: Mercado, Transporte…",
      income: "Ex.: Salário, Freelance…",
    },
    categoryCreated: (name: string) => `Categoria “${name}” criada`,
    categorySaved: "Categoria salva",
    editCategory: "Editar categoria",
    newCard: "Novo cartão",
    editCard: "Editar cartão",
    createCard: "Criar cartão",
    cardCreated: "Cartão criado",
    cardSaved: "Cartão salvo",
    cardName: "Nome do cartão",
    cardNamePlaceholder: "Ex.: Nubank, Inter…",
    design: "Visual",
    useBill: "Acompanhar fatura",
    useBillHint:
      "Com os dias da fatura, cada compra mostra em qual fatura entra. Mudar os dias recalcula as faturas deste cartão.",
    bestPurchaseDay: "Melhor dia de compra",
    dueDay: "Dia de vencimento",
    chooseDay: "Escolha",
    dayOption: (n: number) => `Dia ${n}`,
    billDaysRequired: "Escolha o melhor dia de compra e o dia de vencimento",
    billExample: (close: string, due: string) =>
      `Uma compra feita hoje entra na fatura que fecha em ${close} e vence em ${due}.`,
    cardSummary: (best: number, due: number) =>
      `Melhor dia ${best}, vence dia ${due}`,
    noBill: "Sem fatura",
    name: "Nome",
    icon: "Ícone",
    color: "Cor",
    archive: "Arquivar",
    restore: "Restaurar",
    archived: "Arquivados",
    archivedToast: (name: string) => `“${name}” foi para Arquivados`,
    restoredToast: (name: string) => `“${name}” saiu de Arquivados`,
    nameRequired: "Informe um nome",
    nameTaken: "Já existe um item com esse nome",
    monthlyLimit: "Limite mensal",
    noLimit: "Sem limite",
    limitSummary: (amount: string) => `Limite de ${amount} por mês`,
    monthlyLimitHint:
      "Opcional. O Início mostra quanto ainda dá para gastar nesta categoria no mês.",
    emptyCards: "Nenhum cartão ainda",
    emptyCardsDescription:
      "Crie um cartão com nome e visual. Os dias da fatura são opcionais.",
  },
  auth: {
    title: "Entrar",
    tagline: "Seu dinheiro, tudo contadinho.",
    points: [
      "Anote um gasto em segundos. Pix, boleto ou cartão.",
      "Veja para onde foi cada real, mês a mês.",
      "Feche o mês e saiba se melhorou.",
    ],
    signUpTitle: "Criar conta",
    email: "E-mail",
    password: "Senha",
    passwordHint:
      "Pelo menos 8 caracteres. Uma frase que só você sabe é fácil de lembrar e difícil de adivinhar.",
    showPassword: "Mostrar senha",
    signIn: "Entrar",
    signingIn: "Entrando…",
    noAccount: "Ainda não tem conta?",
    hasAccount: "Já tem conta?",
    forgot: "Esqueci a senha",
    forgotHelp: (email: string) =>
      `Escreva para ${email} a partir do e-mail da sua conta. Respondemos para esse mesmo e-mail com uma senha provisória, que você troca em Ajustes, Conta.`,
    errors: {
      emailInvalid: "Digite um e-mail válido, como nome@exemplo.com.",
      passwordRequired: "Digite sua senha.",
      passwordShort: "Use pelo menos 8 caracteres.",
      passwordLong: "Use no máximo 72 caracteres.",
      invalidCredentials: "E-mail ou senha incorretos.",
      exists: "Já existe uma conta com esse e-mail. Entre com ela.",
      rateLimit:
        "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
      failed: "Não deu para continuar agora. Tente de novo.",
    },
    legal: {
      start: "Ao continuar, você confirma ter 18 anos ou mais e aceita os ",
      terms: "Termos de Uso",
      middle:
        ". Para o app funcionar, usamos seu e-mail e o que você registrar, como explica a ",
      privacy: "Política de Privacidade",
      end: ".",
    },
    cookies: "Usamos só cookies essenciais, para manter você conectado.",
    deleted: "Sua conta foi excluída e seus dados foram apagados.",
    dev: "Entrar como pessoa de teste",
  },
  signup: {
    step: (current: number, total: number) => `Passo ${current} de ${total}`,
    back: "Voltar",
    next: "Continuar",
    nameQuestion: "Oi! Como podemos te chamar?",
    nameLabel: "Seu nome",
    nameRequired: "Digite como quer ser chamado.",
    emailQuestion: (name: string) => `Prazer, ${name}. Qual é o seu e-mail?`,
    emailHint: "É com ele que você entra. Nada de propaganda.",
    emailMissingAt: "Falta o @ no e-mail?",
    passwordQuestion: "Agora crie uma senha",
    passwordRule: "Pelo menos 8 caracteres",
    create: "Criar conta grátis",
    creating: "Criando sua conta…",
    emailTaken: "Já existe uma conta com esse e-mail.",
    signInWith: "Entrar com ele",
    confirmTitle: "Falta um passo: confirme seu e-mail",
    confirmText: (email: string) =>
      `Enviamos um link para ${email}. Abra o e-mail e toque no link para entrar.`,
    categoriesQuestion: "Onde você mais gasta?",
    categoriesHint:
      "Marque o que faz sentido. Dá para mudar depois em Ajustes.",
    expenseLegend: "Gastos",
    incomeLegend: "E o que entra?",
    otherLabel: "Outra categoria",
    add: "Adicionar",
    skip: "Pular",
    cardQuestion: "Você usa cartão de crédito?",
    cardHint: "Assim você anota compras no cartão e acompanha a fatura.",
    yes: "Sim",
    no: "Não",
    cardName: "Nome do cartão",
    cardNamePlaceholder: "Ex.: Nubank",
    cardDesign: "Visual",
    cardDaysLater:
      "Os dias da fatura você completa depois, em Ajustes, Cartões.",
    finish: "Concluir",
    finishing: "Preparando tudo…",
  },
  tour: {
    label: "Tour pelo Contadinho",
    welcomeTitle: "Boas-vindas ao Contadinho",
    welcomeText: "Em 1 minuto você vê onde fica cada coisa.",
    start: "Começar",
    later: "Agora não",
    next: "Próximo",
    back: "Voltar",
    skip: "Pular tour",
    step: (current: number, total: number) => `${current} de ${total}`,
    doneTitle: "Pronto. Agora é só contar.",
    doneText: "Se quiser ver de novo, o tour fica em Ajustes.",
    firstEntry: "Anotar primeiro gasto",
    close: "Fechar",
    replay: "Rever o tour",
    replayHint: "Veja onde fica cada coisa",
    steps: {
      novo: {
        title: "Anote aqui",
        text: "Gasto ou receita, no Pix, no boleto ou no cartão. Leva segundos.",
      },
      saldo: {
        title: "Seu saldo do mês",
        text: "Fica vermelho quando sai mais do que entra.",
      },
      transacoes: {
        title: "Transações",
        text: "Tudo o que você anotou, mês a mês, com busca e filtros.",
      },
      cofrinhos: {
        title: "Cofrinhos",
        text: "Guarde para uma meta e veja quando chega lá.",
      },
      analises: {
        title: "Análises",
        text: "Para onde foi cada real, e o balanço para fechar o mês.",
      },
      ajustes: {
        title: "Ajustes",
        text: "Categorias, cartões e sua conta. O tour fica aqui também.",
      },
    },
  },
  account: {
    title: "Conta",
    hint: "Seus dados, sair e excluir conta",
    signedInAs: "Conectado como",
    signOut: "Sair",
    signOutEverywhere: "Sair de todos os aparelhos",
    signOutEverywhereFailed:
      "Não deu para sair dos outros aparelhos. Tente de novo.",
    signOutEverywhereHint:
      "Encerra o acesso em todos os aparelhos. Nos outros, a saída pode levar até 15 minutos.",
    changePassword: "Alterar senha",
    changePasswordHint: "Troque a senha de entrada",
    changePasswordIntro:
      "Depois da troca, os outros aparelhos são desconectados e precisam entrar com a nova senha.",
    currentPassword: "Senha atual",
    newPassword: "Nova senha",
    wrongCurrentPassword: "A senha atual está incorreta.",
    samePassword: "A nova senha precisa ser diferente da atual.",
    passwordChanged: "Senha alterada. Os outros aparelhos foram desconectados.",
    yourData: "Seus dados",
    export: "Exportar dados",
    exportHint: "Baixe tudo em planilhas CSV",
    terms: "Termos de Uso",
    privacy: "Política de Privacidade",
    delete: "Excluir conta",
    deleteIntro:
      "Isso apaga sua conta e tudo o que você registrou. Não dá para desfazer.",
    deleteWhat: "O que é apagado",
    deleteItems: [
      "Lançamentos, categorias e cartões",
      "Cofrinhos e movimentações",
      "Seu e-mail e sua senha",
    ],
    deleteBackup:
      "As cópias de segurança guardam os dados por até 14 dias e depois são apagadas.",
    deleteExportFirst: "Exportar meus dados antes",
    deleteConfirm: "Entendo que isso apaga tudo e não pode ser desfeito.",
    confirmRequired: "Marque a confirmação para excluir a conta.",
    deleting: "Excluindo…",
  },
  exportData: {
    title: "Exportar dados",
    intro:
      "Baixe seus dados em planilhas CSV. Elas abrem no Excel, no Numbers e no Google Planilhas.",
    files: {
      transactions: "Lançamentos",
      jarEntries: "Movimentações dos cofrinhos",
      jars: "Cofrinhos",
      categories: "Categorias",
      cards: "Cartões",
    },
    fileNames: {
      transactions: "lancamentos",
      jarEntries: "movimentacoes-cofrinhos",
      jars: "cofrinhos",
      categories: "categorias",
      cards: "cartoes",
    },
    downloadShort: "Baixar",
    download: (title: string) => `Baixar ${title}`,
    preparing: "Preparando…",
    done: (title: string, rows: number) =>
      `${title}: ${new Intl.NumberFormat("pt-BR").format(rows)} ${rows === 1 ? "linha baixada" : "linhas baixadas"}`,
    failed: "Não deu para exportar. Tente de novo.",
    installment: (number: number, count: number) => `${number} de ${count}`,
    columns: {
      date: "Data",
      kind: "Tipo",
      amount: "Valor",
      description: "Descrição",
      category: "Categoria",
      payment: "Pagamento",
      card: "Cartão",
      billDue: "Vencimento da fatura",
      installment: "Parcela",
      jar: "Cofrinho",
      note: "Observação",
      name: "Nome",
      icon: "Ícone",
      color: "Cor",
      goal: "Meta",
      deadline: "Prazo",
      planned: "Aporte planejado por mês",
      monthlyLimit: "Limite mensal",
      design: "Visual",
      bestDay: "Melhor dia de compra",
      dueDay: "Dia de vencimento",
      archivedAt: "Arquivado em",
      createdAt: "Criado em",
    },
  },
  cardDesigns: {
    grafite: "Grafite",
    "meia-noite": "Meia-noite",
    oceano: "Oceano",
    floresta: "Floresta",
    "por-do-sol": "Pôr do sol",
    ametista: "Ametista",
    rosa: "Rosa",
    tangerina: "Tangerina",
    ouro: "Ouro",
    prata: "Prata",
  },
  errors: {
    title: "Algo deu errado",
    description:
      "Não foi possível carregar esta tela. Confira sua conexão e tente de novo.",
    retry: "Tentar de novo",
    notFoundTitle: "Página não encontrada",
    notFoundDescription: "O endereço pode estar errado ou o item foi excluído.",
    home: "Ir para o Início",
  },
  colors: {
    "chart-1": "Azul",
    "chart-2": "Laranja",
    "chart-3": "Verde",
    "chart-4": "Vermelho",
    "chart-5": "Rosa",
    "chart-other": "Cinza",
  },
  icons: {
    tag: "Etiqueta",
    "shopping-cart": "Carrinho",
    utensils: "Talheres",
    coffee: "Café",
    car: "Carro",
    fuel: "Combustível",
    bus: "Ônibus",
    plane: "Avião",
    house: "Casa",
    receipt: "Conta",
    zap: "Energia",
    wifi: "Internet",
    smartphone: "Celular",
    "heart-pulse": "Saúde",
    dumbbell: "Academia",
    ticket: "Ingresso",
    "gamepad-2": "Games",
    music: "Música",
    tv: "TV",
    "graduation-cap": "Estudos",
    "book-open": "Livros",
    repeat: "Assinatura",
    "shopping-bag": "Sacola",
    shirt: "Roupas",
    gift: "Presente",
    baby: "Bebê",
    "paw-print": "Pet",
    wrench: "Manutenção",
    percent: "Juros",
    landmark: "Banco",
    briefcase: "Trabalho",
    coins: "Moedas",
    "hand-coins": "Pagamento",
    "trending-up": "Investimento",
    "piggy-bank": "Cofrinho",
    umbrella: "Reserva",
    laptop: "Eletrônicos",
    ellipsis: "Outros",
  },
  jars: {
    emptyTitle: "Nenhum cofrinho ainda",
    emptyDescription:
      "Separe dinheiro para uma meta e veja quando você chega lá.",
    newJar: "Novo cofrinho",
    editJar: "Editar cofrinho",
    edit: "Editar",
    createJar: "Criar cofrinho",
    jarCreated: "Cofrinho criado",
    jarSaved: "Cofrinho salvo",
    totalSaved: "Total guardado",
    balance: "Saldo do cofrinho",
    name: "Nome do cofrinho",
    namePlaceholder: "Ex.: Viagem, Reserva de emergência…",
    goal: "Meta",
    goalHint: "Opcional. Quanto você quer juntar.",
    noGoal: "Sem meta",
    deadline: "Prazo",
    deadlineHint: "Opcional. Até quando você quer chegar lá.",
    planned: "Quanto pretende guardar por mês",
    plannedHint:
      "Opcional. Usado na previsão enquanto ainda não há um mês completo guardando.",
    opening: "Quanto já tem guardado?",
    openingHint: "Opcional. Entra como saldo inicial e não conta no ritmo.",
    ofGoal: (percent: number, goal: string) => `${percent}% de ${goal}`,
    deposit: "Guardar",
    withdraw: "Retirar",
    amount: "Valor",
    depositAmount: (amount: string) => `Guardar ${amount}`,
    withdrawAmount: (amount: string) => `Retirar ${amount}`,
    note: "Observação",
    notePlaceholder: "Opcional",
    deposited: (amount: string) => `${amount} guardados`,
    withdrawn: (amount: string) => `${amount} retirados`,
    notEnough: (amount: string) => `Este cofrinho tem ${amount}.`,
    history: "Movimentações",
    noHistory: "Nenhuma movimentação ainda.",
    openingEntry: "Saldo inicial",
    depositEntry: "Depósito",
    withdrawalEntry: "Retirada",
    deleteEntry: (title: string, amount: string) =>
      `Excluir movimentação: ${title}, ${amount}`,
    entryDeleted: "Movimentação excluída",
    entryRestored: "Movimentação restaurada",
    forecast: "Previsão",
    status: {
      done: "Concluída",
      "on-track": "No ritmo",
      behind: "Abaixo do ritmo",
    },
    arrivesIn: "Você chega lá em",
    afterDeadline: (delay: string) => `${delay} depois do prazo`,
    beforeDeadline: (early: string) => `${early} antes do prazo`,
    onDeadline: "Bem no prazo",
    months: (count: number) => (count === 1 ? "1 mês" : `${count} meses`),
    toReachBy: (month: string) => `Para chegar em ${month}`,
    perMonth: "por mês",
    notReaching: "No ritmo atual, você não chega lá",
    savedAverage: (amount: string, months: number) =>
      months === 1
        ? `Você guardou ${amount} no último mês.`
        : `Você guardou em média ${amount} por mês nos últimos ${months} meses.`,
    plannedSaving: (amount: string) =>
      `Você planeja guardar ${amount} por mês.`,
    noForecast: "Sem previsão no ritmo atual",
    startSaving: "Guarde um valor todo mês para ver quando você chega lá.",
    noPace: "A previsão do seu ritmo aparece depois do primeiro mês guardando.",
    setGoal: "Defina uma meta para ver quando você chega lá",
    deadlinePassed: (date: string) => `O prazo de ${date} já passou.`,
    reached: "Meta alcançada!",
  },
  insights: {
    emptyTitle: "Sem dados para analisar",
    emptyDescription:
      "Registre alguns gastos para ver quanto vai para cada categoria, mês a mês.",
  },
} as const;

type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: readonly string[] };

export type LegalDocument = {
  title: string;
  intro: string;
  sections: readonly { heading: string; blocks: readonly LegalBlock[] }[];
};

export const legal: {
  controller: { name: string; email: string };
  version: string;
  effectiveDate: string;
  backupDays: number;
  back: string;
  important: string;
  terms: LegalDocument;
  privacy: LegalDocument;
} = {
  controller: { name: "Gabriel Rocha", email: "gabrielrsilva203@gmail.com" },
  version: "1.1",
  effectiveDate: "2026-10-06",
  backupDays: 14,
  back: "Voltar",
  important: "Importante: ",
  terms: {
    title: "Termos de Uso",
    intro:
      "Estes termos são as regras para usar o app, e você os aceita ao criar sua conta. Versão {versao}, em vigor desde {data}.",
    sections: [
      {
        heading: "Quem oferece o app",
        blocks: [
          {
            kind: "p",
            text: "Quem oferece o app é {nome}, uma pessoa física que desenvolve e mantém o serviço.",
          },
          {
            kind: "p",
            text: "Para falar sobre estes termos ou sobre qualquer outro assunto, escreva para {email}.",
          },
          {
            kind: "p",
            text: "A Política de Privacidade explica como o app usa seus dados.",
          },
        ],
      },
      {
        heading: "O que o app faz",
        blocks: [
          {
            kind: "p",
            text: "O app ajuda você a registrar gastos e receitas, ver quanto vai para cada categoria e acompanhar cofrinhos com previsão de meta. Ele é gratuito e não tem anúncios.",
          },
          {
            kind: "p",
            text: "O app não é um banco. Ele não se conecta às suas contas, não movimenta dinheiro e não faz pagamentos. Ele mostra só o que você mesmo registra.",
          },
          {
            kind: "p",
            text: "Importante: o app não dá consultoria financeira. Previsões e cálculos são estimativas feitas com o que você registrou. Isso vale, por exemplo, para a data em que você chega a uma meta e para a fatura em que uma compra entra. Eles ajudam a planejar, mas não são garantia.",
          },
        ],
      },
      {
        heading: "Quem pode usar",
        blocks: [
          {
            kind: "p",
            text: "Para usar o app, você precisa ter 18 anos ou mais e criar uma conta com e-mail e senha. Ao criar a conta, você confirma que tem pelo menos 18 anos.",
          },
          {
            kind: "p",
            text: "O app é para uso pessoal, para você organizar o seu dinheiro. Não revenda o acesso nem use o app para prestar serviço a outras pessoas.",
          },
          {
            kind: "p",
            text: "Se soubermos que uma conta é de alguém com menos de 18 anos, excluímos a conta e os dados dela.",
          },
        ],
      },
      {
        heading: "Seus dados são seus",
        blocks: [
          {
            kind: "p",
            text: "O que você registra no app é seu. Usamos esses dados só para fazer o app funcionar para você, como explica a Política de Privacidade.",
          },
          {
            kind: "p",
            text: "Você pode baixar uma cópia dos seus dados quando quiser, em Ajustes, Conta, com o botão “Exportar dados”. Também pode excluir sua conta a qualquer momento.",
          },
        ],
      },
      {
        heading: "Responsabilidades",
        blocks: [
          {
            kind: "p",
            text: "Você responde pelo que registra e pelo uso da sua conta. Evite registrar dados de outras pessoas além do necessário para o seu controle.",
          },
          {
            kind: "p",
            text: "Sua senha é a chave do app. Use uma senha que você não usa em outros sites e não a compartilhe. Se suspeitar de acesso indevido, troque a senha em Ajustes, Conta, com o botão “Alterar senha”. A troca desconecta os outros aparelhos.",
          },
          {
            kind: "p",
            text: "Use um e-mail que seja seu. O app não confirma o e-mail, mas é por ele que falamos com você e que você recupera o acesso se esquecer a senha.",
          },
          {
            kind: "p",
            text: "Nós respondemos pelos danos que o serviço causar, como manda a lei, inclusive o Código de Defesa do Consumidor. Nada nestes termos tira ou reduz os seus direitos.",
          },
        ],
      },
      {
        heading: "Regras e limites de uso",
        blocks: [
          {
            kind: "p",
            text: "Para manter o app seguro para todos, você não pode:",
          },
          {
            kind: "ul",
            items: [
              "Tentar acessar dados de outras pessoas.",
              "Usar robôs ou outros programas automáticos para sobrecarregar o serviço ou criar contas em massa.",
              "Tentar burlar o login, a segurança ou os limites do app.",
              "Usar o app para fraude ou qualquer outra atividade ilegal.",
            ],
          },
          {
            kind: "p",
            text: "Importante: cada conta tem limites, para manter o serviço gratuito e estável. Itens arquivados também contam. Ao chegar a um limite, o app não deixa criar novos itens daquele tipo.",
          },
          {
            kind: "ul",
            items: [
              "50.000 lançamentos",
              "200 categorias",
              "30 cartões",
              "50 cofrinhos",
              "5.000 movimentações nos cofrinhos",
            ],
          },
        ],
      },
      {
        heading: "Disponibilidade e cópias de segurança",
        blocks: [
          {
            kind: "p",
            text: "Importante: o app pode ficar fora do ar às vezes, por manutenção ou por falha. Trabalhamos para que isso seja raro e dure pouco, mas não dá para garantir um serviço sem nenhuma interrupção.",
          },
          {
            kind: "p",
            text: "Importante: fazemos uma cópia de segurança criptografada todos os dias. Se houver uma falha grave, recuperamos seus dados a partir da cópia mais recente. O que você registrou depois dela pode se perder.",
          },
          {
            kind: "p",
            text: "Por isso, recomendamos usar “Exportar dados” com frequência e guardar o arquivo. Nada disso reduz os seus direitos previstos em lei.",
          },
        ],
      },
      {
        heading: "Suspensão e encerramento",
        blocks: [
          {
            kind: "p",
            text: "Você pode excluir sua conta quando quiser, em Ajustes, Conta, com o botão “Excluir conta”. O app apaga seus dados na hora, como explica a Política de Privacidade.",
          },
          {
            kind: "p",
            text: "Importante: se você descumprir as regras de uso, podemos suspender sua conta. Antes, avisamos você por e-mail, com o motivo. Se houver risco imediato ao serviço ou a outras pessoas, podemos suspender primeiro e avisar logo depois.",
          },
          {
            kind: "p",
            text: "Durante a suspensão, você pode responder ao aviso e pedir uma cópia dos seus dados pelo e-mail {email}.",
          },
          {
            kind: "p",
            text: "Importante: se o app for encerrado, avisaremos com pelo menos 30 dias de antecedência, no app e por e-mail, para você exportar seus dados. Depois desse prazo, apagamos todos os dados.",
          },
        ],
      },
      {
        heading: "Mudanças nestes termos",
        blocks: [
          {
            kind: "p",
            text: "Podemos mudar estes termos, por exemplo, quando o app ganhar novas funções ou a lei mudar. Antes de a mudança valer, mostramos um aviso em destaque no app explicando o que mudou.",
          },
          {
            kind: "p",
            text: "Se a mudança for relevante, como uma nova obrigação para você, também avisamos por e-mail. Se não concordar, você pode exportar seus dados e excluir sua conta, sem custo.",
          },
          {
            kind: "p",
            text: "A versão e a data ficam no topo desta página.",
          },
        ],
      },
      {
        heading: "Lei e foro",
        blocks: [
          {
            kind: "p",
            text: "Estes termos seguem as leis do Brasil.",
          },
          {
            kind: "p",
            text: "Se houver uma disputa, ela será resolvida no foro da cidade onde você mora.",
          },
          {
            kind: "p",
            text: "Antes, se preferir, escreva para {email} para tentarmos resolver juntos.",
          },
        ],
      },
    ],
  },
  privacy: {
    title: "Política de Privacidade",
    intro:
      "Esta política explica quais dados o app usa, para quê e como você controla tudo. Versão {versao}, em vigor desde {data}.",
    sections: [
      {
        heading: "Em resumo",
        blocks: [
          {
            kind: "ul",
            items: [
              "Para o app funcionar, usamos seu e-mail, sua senha protegida e o que você registra. Sem esses dados, não é possível usar o serviço.",
              "Não vendemos seus dados, não mostramos anúncios e não usamos inteligência artificial com eles.",
              "A cópia principal dos seus dados fica em São Paulo. Uma cópia de segurança criptografada e alguns registros técnicos ficam nos Estados Unidos.",
              "No próprio app, você pode exportar, corrigir e apagar seus dados quando quiser.",
              "Dúvidas ou pedidos: {email}.",
            ],
          },
        ],
      },
      {
        heading: "Quem cuida dos seus dados",
        blocks: [
          {
            kind: "p",
            text: "O responsável pelos seus dados é {nome}, pessoa física que desenvolve e mantém o app. A Lei Geral de Proteção de Dados Pessoais (LGPD) chama esse papel de controlador.",
          },
          {
            kind: "p",
            text: "A Agência Nacional de Proteção de Dados (ANPD) fiscaliza o cumprimento da LGPD. Pelas regras dela, uma pessoa física que mantém um serviço como este é um agente de tratamento de pequeno porte. Por isso, não há encarregado de dados. Em vez disso, há um canal de privacidade para você falar direto com o responsável: {email}.",
          },
        ],
      },
      {
        heading: "Dados que usamos",
        blocks: [
          {
            kind: "ul",
            items: [
              "Da sua conta: e-mail e senha. A senha é guardada só de forma protegida, num formato que não permite descobrir a senha original. Nem nós conseguimos ver sua senha.",
              "Lançamentos: tipo (despesa ou receita), valor, data, descrição, categoria, forma de pagamento e, nas compras parceladas, as parcelas.",
              "Categorias: nome, ícone, cor e limite mensal, se você definir um.",
              "Formas de pagamento: Pix, Boleto ou cartões que você cria, com nome e visual. Se quiser, também o melhor dia de compra e o dia de vencimento da fatura.",
              "Cofrinhos: nome, ícone, cor e, se você definir, meta, prazo e quanto pretende guardar por mês.",
              "Movimentações dos cofrinhos: depósitos, retiradas e saldo inicial, com valor, data e uma observação, se você escrever.",
              "Dados técnicos: o endereço de internet do seu aparelho, chamado endereço IP, o navegador e o horário de acesso. Eles ficam nas suas sessões de login e nos registros técnicos do Supabase e da Vercel.",
              "Cookies essenciais, explicados na seção Cookies.",
            ],
          },
          {
            kind: "p",
            text: "Não coletamos seu nome, dados de conta bancária, número de cartão nem sua localização. Também não usamos ferramentas de análise de uso, anúncios ou inteligência artificial.",
          },
          {
            kind: "p",
            text: "Pedimos que você não escreva nas descrições e observações nada além do necessário. Evite números de cartão, senhas e dados sensíveis, como informações de saúde, religião ou opinião política.",
          },
        ],
      },
      {
        heading: "Por que usamos seus dados",
        blocks: [
          {
            kind: "p",
            text: "Usamos seus dados só para estas finalidades. Cada uma tem uma base legal na LGPD:",
          },
          {
            kind: "ul",
            items: [
              "Criar sua conta, reconhecer você no login, guardar o que você registra e mostrar totais, análises e previsões. Base legal: execução do contrato, ou seja, dos Termos de Uso que você aceita ao criar sua conta (art. 7º, V).",
              "Falar com você quando for preciso: responder seus pedidos e avisar sobre segurança, mudanças importantes ou o fim do serviço. Não mandamos propaganda. Base legal: execução do contrato e cumprimento de obrigação legal (art. 7º, V e II).",
              "Manter o serviço no ar e seguro, com registros técnicos de acesso e cópias de segurança. Base legal: execução do contrato (art. 7º, V), porque sem isso não dá para prestar o serviço.",
              "Manter você conectado com cookies essenciais, aplicar os limites de uso e evitar abuso. Base legal: legítimo interesse (art. 7º, IX), usando só o mínimo necessário.",
              "Cumprir a lei e ordens de autoridades, e defender direitos em processos. Base legal: cumprimento de obrigação legal e exercício regular de direitos (art. 7º, II e VI).",
            ],
          },
          {
            kind: "p",
            text: "Nenhum desses usos depende do seu consentimento. Eles são o que o app precisa para funcionar. Você pode encerrá-los quando quiser, excluindo sua conta, salvo o que a lei mandar guardar.",
          },
        ],
      },
      {
        heading: "Com quem compartilhamos",
        blocks: [
          {
            kind: "p",
            text: "Não vendemos seus dados e não os entregamos a anunciantes. Só estes serviços recebem dados, porque o app precisa deles para funcionar:",
          },
          {
            kind: "ul",
            items: [
              "Supabase: banco de dados e login. Os servidores ficam em São Paulo, e a empresa é dos Estados Unidos. Atua como operador, ou seja, trata os dados em nosso nome.",
              "Vercel: hospedagem do app. As funções do app rodam em São Paulo, e a empresa é dos Estados Unidos, onde ficam os registros de acesso. Também atua como operador.",
              "GitHub: gera e guarda a cópia de segurança diária, criptografada, nos Estados Unidos. Também atua como operador.",
            ],
          },
          {
            kind: "p",
            text: "Também entregamos dados quando a lei ou uma ordem judicial exigir, e só o que for exigido.",
          },
        ],
      },
      {
        heading: "Dados fora do Brasil",
        blocks: [
          {
            kind: "p",
            text: "O Supabase, a Vercel e o GitHub são empresas dos Estados Unidos, e alguns dados vão para lá. A lei chama isso de transferência internacional. Ela funciona assim:",
          },
          {
            kind: "ul",
            items: [
              "O que vai: registros técnicos de acesso, com endereço IP, navegador e página acessada, e uma cópia de todos os seus dados. O GitHub gera e testa essa cópia toda noite num servidor temporário e só guarda a versão criptografada. As equipes técnicas do Supabase e da Vercel também podem acessar dados quando for preciso para manter o serviço.",
              "Para quê: hospedar o app, mantê-lo funcionando com segurança e guardar cópias de segurança.",
              "Para onde: Estados Unidos. As equipes técnicas dessas empresas podem trabalhar de outros países.",
              "Por quanto tempo: registros da Vercel, cerca de 1 hora. Registros do Supabase, cerca de 1 dia. Cada cópia de segurança, {backupDias} dias.",
              "Com que base: a transferência é necessária para prestar o serviço que você pediu ao aceitar os Termos de Uso (LGPD, art. 33, IX, com o art. 7º, V).",
              "Quem responde: {nome}, pelo canal {email}. Supabase, Vercel e GitHub tratam os dados como operadores, com medidas de segurança como criptografia e controle de acesso.",
              "Compartilhamento: ninguém além dessas empresas recebe esses dados.",
              "Seus direitos: valem também aqui. Use o canal {email} e, se precisar, reclame à ANPD.",
            ],
          },
        ],
      },
      {
        heading: "Por quanto tempo guardamos",
        blocks: [
          {
            kind: "ul",
            items: [
              "Sua conta e o que você registrou: até você excluir a conta. Quando você exclui, apagamos tudo na hora.",
              "Lançamentos que você exclui: até 2 dias, para o botão “Desfazer” funcionar. Depois, apagamos esses lançamentos.",
              "Sessões de login, com endereço IP e navegador: até você sair daquele aparelho ou excluir a conta.",
              "Registros técnicos: cerca de 1 dia no Supabase e cerca de 1 hora na Vercel.",
              "Cópias de segurança: {backupDias} dias cada uma. Por isso, um dado apagado pode continuar numa cópia por até {backupDias} dias.",
              "Registros de incidentes de segurança: 5 anos, como exige a ANPD.",
            ],
          },
          {
            kind: "p",
            text: "Se uma lei ou ordem judicial exigir, guardamos o dado necessário pelo tempo exigido.",
          },
        ],
      },
      {
        heading: "Seus direitos",
        blocks: [
          {
            kind: "p",
            text: "A LGPD garante estes direitos a você, sem custo. Veja como usar cada um:",
          },
          {
            kind: "ul",
            items: [
              "Ver seus dados e levá-los para outro serviço: em Ajustes, Conta, use “Exportar dados” para baixar uma cópia em formato CSV, que abre em programas de planilha.",
              "Corrigir: edite qualquer lançamento, categoria, cartão ou cofrinho no próprio app. Para corrigir outro dado, como seu e-mail, escreva para {email}.",
              "Apagar: em Ajustes, Conta, use “Excluir conta”. Apagamos na hora sua conta e tudo o que você registrou.",
              "Encerrar acessos: em Ajustes, Conta, use “Sair de todos os aparelhos”. Nos outros aparelhos, isso pode levar até 15 minutos.",
              "Saber se tratamos dados seus e com quem compartilhamos: a lista está nesta política, e você também pode perguntar em {email}.",
              "Pedir que anonimizemos, bloqueemos ou apaguemos dados desnecessários, excessivos ou tratados fora da lei: escreva para {email}. Anonimizar é tirar dos dados tudo o que identifica você.",
              "Se opor a um uso que descumpra a lei: escreva para {email}.",
              "Consentimento: nada no app depende dele. Se isso mudar, você poderá negar ou retirar o consentimento, e explicaremos o que acontece em cada caso.",
            ],
          },
          {
            kind: "p",
            text: "Respondemos pedidos por e-mail em até 15 dias, de forma simplificada. Se você pedir uma declaração completa, com a origem dos dados e a finalidade de cada uso, respondemos em até 30 dias.",
          },
          {
            kind: "p",
            text: "Se não ficar satisfeito, você pode reclamar à ANPD pelo serviço “Abrir requerimento relacionado à LGPD”, no portal gov.br. Também pode procurar os órgãos de defesa do consumidor.",
          },
        ],
      },
      {
        heading: "Segurança",
        blocks: [
          {
            kind: "ul",
            items: [
              "A conexão entre o seu aparelho e o app usa sempre criptografia.",
              "O banco de dados tem regras por pessoa: cada conta só lê e altera os próprios dados.",
              "Sua senha é protegida com bcrypt, um método de mão única feito para senhas. O app nunca guarda nem mostra a senha em texto.",
              "Depois de muitas tentativas seguidas de entrar, o login fica bloqueado por alguns minutos.",
              "A chave de administração do banco fica só no servidor e nunca chega ao seu navegador.",
              "O código de acesso do seu login vale por 15 minutos e se renova sozinho enquanto você usa o app.",
              "Criptografamos as cópias de segurança, e a chave para abri-las fica separada delas.",
            ],
          },
          {
            kind: "p",
            text: "Se você esquecer a senha, escreva para {email} a partir do e-mail da sua conta. Respondemos para esse mesmo e-mail com uma senha provisória, que você troca no app.",
          },
          {
            kind: "p",
            text: "Nenhum sistema é totalmente seguro. Se um incidente puder causar risco ou dano relevante a você, avisamos você e a ANPD nos prazos da lei. O aviso vai por e-mail, ou aparece no app se não for possível falar com você direto.",
          },
        ],
      },
      {
        heading: "Cookies",
        blocks: [
          {
            kind: "p",
            text: "Cookies são pequenos arquivos que um site guarda no seu navegador. Usamos só um cookie essencial, sem o qual você não consegue entrar no app:",
          },
          {
            kind: "ul",
            items: [
              "Cookie de sessão: mantém você conectado. O nome começa com “sb-” e termina com “-auth-token”. Quando fica grande, ele se divide em partes que terminam em “.0” e “.1”. Dura até 400 dias, ou até você sair.",
            ],
          },
          {
            kind: "p",
            text: "Não usamos cookies de análise nem de publicidade. As fontes do app vêm do nosso próprio servidor, sem pedidos a outros sites.",
          },
          {
            kind: "p",
            text: "Por ser essencial, esse cookie não depende da sua autorização. Mesmo assim, avisamos sobre ele nas telas de entrada e de cadastro.",
          },
        ],
      },
      {
        heading: "Idade mínima",
        blocks: [
          {
            kind: "p",
            text: "O app é só para maiores de 18 anos. Ao criar a conta, você declara ter 18 anos ou mais. Não pedimos documento, então contamos com a sua declaração.",
          },
          {
            kind: "p",
            text: "Se soubermos que uma conta é de alguém com menos de 18 anos, excluímos a conta e os dados dela. Se você souber de algum caso, avise em {email}.",
          },
        ],
      },
      {
        heading: "Acessibilidade",
        blocks: [
          {
            kind: "p",
            text: "Queremos que todas as pessoas consigam usar o app. Seguimos as Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.2, nível AA. Elas equivalem à conformidade regular da norma brasileira de acessibilidade na web, da Associação Brasileira de Normas Técnicas (ABNT NBR 17225:2025). Testamos o app com teclado, leitor de tela, zoom e tema escuro. Se algo não funcionar para você, escreva para {email}.",
          },
        ],
      },
      {
        heading: "Mudanças nesta política",
        blocks: [
          {
            kind: "p",
            text: "Quando esta política mudar, mostramos um aviso em destaque no app antes de a mudança valer, explicando o que mudou.",
          },
          {
            kind: "p",
            text: "A versão e a data ficam no topo desta página. Guardamos as versões anteriores, e você pode pedi-las em {email}.",
          },
        ],
      },
    ],
  },
};
