export const m = {
  app: {
    name: "Portal",
    shortName: "Portal",
    description:
      "Turmas, alunos, frequência e impacto do Instituto Portal em um só lugar.",
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
    classes: "Turmas",
    students: "Alunos",
    more: "Mais",
    settings: "Ajustes",
  },
  dates: {
    date: "Data",
    today: "Hoje",
    yesterday: "Ontem",
    otherDate: "Outra data",
    previousMonth: "Mês anterior",
    nextMonth: "Próximo mês",
  },
  home: {
    greeting: (name: string | null) => (name ? `Olá, ${name}` : "Olá"),
    emptyTitle: "Nada para hoje",
    emptyDescription:
      "Quando suas turmas tiverem aulas, a chamada do dia aparece aqui.",
  },
  classes: {
    title: "Turmas",
    emptyTitle: "Nenhuma turma ainda",
    emptyDescription:
      "As turmas da sua unidade aparecem aqui, com horários, alunos e frequência.",
  },
  students: {
    title: "Alunos",
    emptyTitle: "Nenhum aluno ainda",
    emptyDescription:
      "Cada aluno tem um perfil com as turmas que já fez, a frequência e as notas.",
  },
  more: {
    title: "Mais",
  },
  settings: {
    nameRequired: "Informe um nome",
  },
  auth: {
    title: "Entrar",
    tagline: "Turmas, alunos e frequência do instituto em um só lugar.",
    email: "E-mail",
    password: "Senha",
    passwordHint:
      "Pelo menos 8 caracteres. Uma frase que só você sabe é fácil de lembrar e difícil de adivinhar.",
    showPassword: "Mostrar senha",
    signIn: "Entrar",
    signingIn: "Entrando…",
    forgot: "Esqueci a senha",
    forgotHelp:
      "Peça à coordenação da sua unidade um link para criar uma senha nova.",
    noAccess:
      "Ainda não tem acesso? Peça um convite à coordenação da sua unidade.",
    errors: {
      emailInvalid: "Digite um e-mail válido, como nome@exemplo.com.",
      passwordRequired: "Digite sua senha.",
      passwordShort: "Use pelo menos 8 caracteres.",
      passwordLong: "Use no máximo 72 caracteres.",
      invalidCredentials: "E-mail ou senha incorretos.",
      exists: "Já existe uma conta com esse e-mail.",
      rateLimit:
        "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
      failed: "Não deu para continuar agora. Tente de novo.",
    },
    legal: {
      start: "Ao entrar, você aceita os ",
      terms: "Termos de Uso",
      middle:
        ". Os dados que você registra servem só ao trabalho do instituto, como explica a ",
      privacy: "Política de Privacidade",
      end: ".",
    },
    cookies: "Usamos só cookies essenciais, para manter você conectado.",
    dev: "Entrar como pessoa de teste",
  },
  tour: {
    label: "Tour pelo Portal",
    welcomeTitle: "Boas-vindas ao Portal",
    welcomeText: "Em 1 minuto você vê onde fica cada coisa.",
    start: "Começar",
    later: "Agora não",
    next: "Próximo",
    back: "Voltar",
    skip: "Pular tour",
    step: (current: number, total: number) => `${current} de ${total}`,
    doneTitle: "Pronto. Bom trabalho!",
    doneText: "Se quiser ver de novo, o tour fica em Ajustes.",
    close: "Fechar",
    replay: "Rever o tour",
    replayHint: "Veja onde fica cada coisa",
    steps: {
      acao: {
        title: "Atalho do dia",
        text: "O caminho mais curto para o que você mais faz, como a chamada de hoje.",
      },
      turmas: {
        title: "Turmas",
        text: "Suas turmas com horários, alunos, aulas e notas.",
      },
      alunos: {
        title: "Alunos",
        text: "Encontre qualquer aluno e veja o histórico completo.",
      },
      mais: {
        title: "Mais",
        text: "Sua conta, os ajustes e o restante do Portal.",
      },
      ajustes: {
        title: "Ajustes",
        text: "Sua conta e as configurações do Portal. O tour fica aqui também.",
      },
    },
  },
  account: {
    title: "Conta",
    hint: "Seus dados de acesso e sair",
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
    terms: "Termos de Uso",
    privacy: "Política de Privacidade",
  },
  roles: {
    admin: "Coordenação",
    teacher: "Professor",
    adminGeral: "Administração geral",
  },
  team: {
    title: "Equipe",
    hint: "Convide professores e coordenação",
    invite: "Convidar",
    inviteTitle: "Convidar para a equipe",
    name: "Nome",
    namePlaceholder: "Como a pessoa é chamada",
    nameRequired: "Informe o nome da pessoa",
    unit: "Unidade",
    role: "Função",
    unitRequired: "Escolha a unidade",
    createLink: "Gerar link de convite",
    creating: "Gerando…",
    linkReady: (name: string) => `Convite para ${name} pronto`,
    linkHint:
      "O link vale por 7 dias e só pode ser usado uma vez. Envie direto para a pessoa.",
    resetReady: (name: string) => `Link de nova senha para ${name} pronto`,
    resetHint:
      "O link vale por 24 horas e só pode ser usado uma vez. Envie direto para a pessoa.",
    shareWhatsApp: "Enviar no WhatsApp",
    copy: "Copiar link",
    copied: "Link copiado",
    linkLabel: "Link",
    inviteMessage: (name: string, link: string) =>
      `Olá, ${name}! Este é o seu convite para a equipe do Portal: ${link}`,
    resetMessage: (name: string, link: string) =>
      `Olá, ${name}! Use este link para criar uma senha nova no Portal: ${link}`,
    another: "Convidar outra pessoa",
    pending: "Convites pendentes",
    expires: (date: string) => `Vale até ${date}`,
    cancelInvite: (name: string) => `Cancelar convite de ${name}`,
    cancelled: "Convite cancelado",
    members: "Pessoas",
    you: "Você",
    deactivated: "Acesso desativado",
    roleIn: (role: string, unit: string) => `${role} em ${unit}`,
    units: "Unidades e funções",
    noUnits: "Sem unidade",
    addUnit: "Adicionar a uma unidade",
    add: "Adicionar",
    remove: (unit: string) => `Remover de ${unit}`,
    removed: (unit: string) => `Removido de ${unit}`,
    added: "Unidade adicionada",
    access: "Acesso",
    resetLink: "Gerar link para nova senha",
    deactivate: "Desativar acesso",
    deactivateTitle: (name: string) => `Desativar o acesso de ${name}?`,
    deactivateText:
      "A pessoa sai do Portal na hora, em todos os aparelhos. O histórico do que ela registrou continua guardado e o acesso pode ser reativado.",
    deactivatedDone: "Acesso desativado",
    reactivate: "Reativar acesso",
    reactivated: "Acesso reativado",
    adminGeralHint: "Vê e gerencia todas as unidades",
    lastAdmin: "É preciso manter ao menos uma pessoa na administração geral.",
    saved: "Alterações salvas",
    readOnly:
      "Esta pessoa também trabalha em outra unidade ou é da coordenação. Só a administração geral muda o acesso dela.",
  },
  units: {
    title: "Unidades",
    hint: "Recife Antigo, Boa Viagem e novas unidades",
    code: "Sigla",
    codeHint: "De 2 a 6 letras, como RA",
    codeInvalid: "Use de 2 a 6 letras, sem acento",
    name: "Nome",
    new: "Nova unidade",
    create: "Criar unidade",
    created: (name: string) => `Unidade ${name} criada`,
    saved: "Unidade salva",
    taken: "Já existe uma unidade com essa sigla ou nome",
    edit: "Editar unidade",
  },
  invite: {
    title: "Convite para o Portal",
    text: (name: string, role: string, unit: string) =>
      `Olá, ${name}! Você recebeu um convite para a equipe do Portal como ${role} na unidade ${unit}.`,
    createAccess: "Crie seu acesso com o e-mail que você usa no dia a dia.",
    nameLabel: "Seu nome",
    accept: "Criar acesso e entrar",
    accepting: "Criando seu acesso…",
    invalidTitle: "Este convite não vale mais",
    invalidText:
      "Ele pode ter expirado, já ter sido usado ou cancelado. Peça um novo link à coordenação.",
    signedInAs: (email: string) => `Você está conectado como ${email}.`,
    acceptSignedIn: "Aceitar convite",
    emailTaken:
      "Já existe uma conta com esse e-mail. Entre com ela e abra o link de novo.",
  },
  reset: {
    title: "Criar nova senha",
    text: (name: string | null) =>
      name
        ? `Olá, ${name}! Escolha uma senha nova para entrar no Portal.`
        : "Escolha uma senha nova para entrar no Portal.",
    save: "Salvar nova senha",
    saving: "Salvando…",
    invalidTitle: "Este link não vale mais",
    invalidText:
      "Ele pode ter expirado ou já ter sido usado. Peça um novo link à coordenação.",
    done: "Senha nova salva. Entre com ela.",
  },
  noAccess: {
    title: "Sem acesso ao Portal",
    text: "Sua conta não está ligada a nenhuma unidade ou o acesso foi desativado. Fale com a coordenação da sua unidade.",
  },
  errors: {
    title: "Algo deu errado",
    description:
      "Não foi possível carregar esta tela. Confira sua conexão e tente de novo.",
    retry: "Tentar de novo",
    notFoundTitle: "Página não encontrada",
    notFoundDescription:
      "O endereço pode estar errado ou este item não está disponível para você.",
    forbiddenTitle: "Você não tem acesso a esta página",
    forbiddenDescription:
      "Se precisar dela, fale com a coordenação da sua unidade.",
    home: "Ir para o Início",
    forbidden: "Você não tem permissão para isso.",
    locked: "Este registro está fechado e não pode mais ser alterado.",
    limit: "Limite atingido. Fale com a coordenação da sua unidade.",
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
  controller: { name: string; cnpj: string; email: string; address: string };
  version: string;
  effectiveDate: string;
  backupDays: number;
  back: string;
  important: string;
  terms: LegalDocument;
  privacy: LegalDocument;
} = {
  controller: {
    name: "Instituto Portal Social da Ponte",
    cnpj: "39.821.813/0001-88",
    email: "assistenciasocial@oportal.org",
    address: "Rua José da Silva Lucena, Imbiribeira, Recife, PE, CEP 51150-430",
  },
  version: "0.1",
  effectiveDate: "2026-10-14",
  backupDays: 14,
  back: "Voltar",
  important: "Importante: ",
  terms: {
    title: "Termos de Uso",
    intro:
      "Versão provisória {versao}, em vigor desde {data}. O texto final passa por revisão jurídica antes do uso com dados reais.",
    sections: [
      {
        heading: "Para que serve o Portal",
        blocks: [
          {
            kind: "p",
            text: "O Portal é o sistema interno do {nome} para organizar cursos, turmas, alunos, frequência e notas. Só entra quem faz parte da equipe e recebeu convite da coordenação.",
          },
        ],
      },
      {
        heading: "Sua conta",
        blocks: [
          {
            kind: "ul",
            items: [
              "A conta é pessoal. Não compartilhe sua senha.",
              "Use o Portal só para o trabalho no instituto.",
              "Quando você deixa a equipe, a coordenação encerra seu acesso.",
            ],
          },
        ],
      },
      {
        heading: "Dados de alunos e famílias",
        blocks: [
          {
            kind: "p",
            text: "Importante: os dados de alunos e famílias são confidenciais. Consulte só o que precisa para o seu trabalho e não copie esses dados para fora do Portal.",
          },
        ],
      },
    ],
  },
  privacy: {
    title: "Política de Privacidade",
    intro:
      "Versão provisória {versao}, em vigor desde {data}. O texto final passa por revisão jurídica antes do uso com dados reais.",
    sections: [
      {
        heading: "Quem cuida dos dados",
        blocks: [
          {
            kind: "p",
            text: "O {nome}, associação privada sem fins lucrativos, CNPJ {cnpj}, com sede na {endereco}, decide como os dados são usados e responde por eles.",
          },
          {
            kind: "p",
            text: "Para tirar dúvidas, pedir acesso, correção ou exclusão dos seus dados, escreva para {email}.",
          },
        ],
      },
      {
        heading: "Quais dados usamos",
        blocks: [
          {
            kind: "ul",
            items: [
              "Da equipe: nome, e-mail e os registros de acesso necessários para a segurança.",
              "Dos alunos e responsáveis: cadastro, matrículas, frequência e notas.",
              "Informações sociais, só com consentimento e só para a coordenação.",
            ],
          },
        ],
      },
      {
        heading: "Para que usamos",
        blocks: [
          {
            kind: "p",
            text: "Para organizar as atividades do instituto, acompanhar cada aluno e prestar contas a parceiros apenas com números agregados, sem identificar ninguém.",
          },
        ],
      },
      {
        heading: "Cookies e cópias de segurança",
        blocks: [
          {
            kind: "ul",
            items: [
              "Usamos só cookies essenciais, para manter você conectado.",
              "As cópias de segurança são cifradas e guardadas por até {backupDias} dias.",
            ],
          },
        ],
      },
    ],
  },
};
