# Registro das operações de tratamento

Versão provisória, revisada em 14 de outubro de 2026. Precisa de revisão jurídica e de um Relatório de Impacto à
Proteção de Dados (RIPD) antes de entrar qualquer dado real de aluno.

- Controlador: Instituto Portal Social da Ponte, associação privada, CNPJ 39.821.813/0001-88, Rua José da Silva
  Lucena, Imbiribeira, Recife, PE, CEP 51150-430. Presidente: Igor Sacha Florentino Cruz (fonte: Mapa das OSCs,
  Ipea).
- Contato do titular: assistenciasocial@oportal.org. Encarregado (DPO) a nomear.
- Titulares hoje: pessoas da equipe (coordenação e professores), convidadas pela coordenação.
- Titulares a partir das próximas fases: alunos, incluindo menores de idade, e seus responsáveis.
- Operadores: Supabase (banco e login), Vercel (hospedagem) e GitHub (backup), pelos termos e DPAs de cada um.

| Dados | Finalidade | Base legal | Retenção | Compartilhamento | Transferência internacional |
| --- | --- | --- | --- | --- | --- |
| Equipe: nome, e-mail e hash bcrypt da senha | Dar acesso ao sistema | Legítimo interesse (art. 7º, IX) | Enquanto a pessoa fizer parte da equipe; backup por mais 14 dias | Supabase (Auth) | Banco no Brasil (sa-east-1); cópia nos EUA pelo backup |
| Sessão: cookies essenciais com token de acesso de 15 minutos e token de renovação; IP e navegador da sessão | Manter o login seguro | Legítimo interesse (art. 7º, IX) | Token de acesso: 15 minutos; sessão: até sair | Supabase (Auth) | Não |
| Backup cifrado, sem sessões | Recuperar o serviço depois de falha ou incidente | Dever de segurança (art. 46) | 14 dias | GitHub (artefato do Actions) | Sim, EUA: gerado e testado num servidor temporário do GitHub, guardado cifrado com chave offline |
| Registros técnicos de acesso: IP, navegador, data e hora | Segurança e diagnóstico | Legítimo interesse (art. 7º, IX) | Padrão de cada fornecedor | Vercel, Supabase | Sim, EUA |
| Inscrição online: nome, data de nascimento, telefone, e-mail e bairro opcionais, responsável de menores | Selecionar participantes e entrar em contato | Consentimento (art. 7º, I; art. 14 para menores) | Até a matrícula ou até o fim da seleção; recusadas e desistentes são apagadas na limpeza periódica (a implementar na fase de LGPD) | Supabase (banco) | Banco no Brasil; cópia nos EUA pelo backup |
| Registro de incidentes ([runbook](runbook.md)) | Cumprir a Res. CD/ANPD 15/2024 | Obrigação legal (art. 7º, II) | 5 anos | ANPD, quando o incidente for comunicado | Não |

Segurança: RLS em todas as tabelas expostas, cadastro público desligado (só entra quem recebe convite), senha só como
hash bcrypt, limite de tentativas de login do Supabase, só cookies essenciais, token de acesso de 15 minutos, backup
cifrado com chave offline e segredos só no GitHub e na Vercel.

## Alunos, dados sensíveis e menores

O tratamento é de alto risco (Res. CD/ANPD 2/2022, art. 4º): há dados de crianças e adolescentes e dados sensíveis
(cor ou raça, saúde, deficiência). O que o Portal já faz:

| Dados | Finalidade | Base legal | Quem acessa | Retenção |
| --- | --- | --- | --- | --- |
| Cadastro, responsáveis, matrículas, frequência, notas | Executar os cursos | Consentimento do termo de matrícula (art. 7º, I; art. 14 para menores) | Coordenação da unidade; professores só dos próprios alunos | Enquanto houver vínculo e pelo prazo de prestação de contas das parcerias; depois, anonimização |
| Sala de aula: acessibilidade e observações pedagógicas | Adaptar as aulas | Mesmo termo | Professores dos alunos com matrícula ativa | Idem |
| Ficha socioeconômica versionada e egressos | Acompanhamento social e indicadores agregados | Mesmo termo | Só coordenação, com registro de cada leitura | Idem |
| Cor ou raça, deficiência, saúde | Acompanhamento social e indicadores agregados | Consentimento específico (art. 11, I) | Só coordenação | Apagados ao revogar o termo |

Controles no sistema:

1. RLS no banco separa professor, coordenação da unidade e administração geral.
2. Leituras da ficha, exportações e anonimizações vão para `private.audit_log`, só com nomes de colunas, nunca valores.
3. Dados sensíveis só entram com termo específico ativo; revogar o termo apaga esses campos em todas as versões.
4. Exportação completa (aba Dados do aluno) atende pedido de acesso e portabilidade.
5. Anonimização (administração geral) atende pedido de exclusão sem perder os números agregados.
6. A limpeza diária (`private.purge_expired()`, no workflow Backup) apaga inscrições recusadas ou desistentes após 180 dias,
   inscrições paradas após 1 ano e convites e links vencidos.

Pendências fora do sistema:

1. Elaborar o RIPD e nomear o encarregado (DPO); publicar o contato na Política de Privacidade.
2. Revisão jurídica dos termos impressos (matrícula, uso de imagem, dados sensíveis) e da Política de Privacidade.
3. Confirmar o prazo de guarda exigido pelas parcerias (ex.: MROSC, Lei 13.019/2014, art. 68).
4. Divulgar a patrocinadores apenas números agregados, escondendo grupos com menos de 5 pessoas (painel de impacto).

## Impacto e patrocinadores

- O painel Impacto e o relatório impresso mostram só números agregados, calculados no banco (`impact_report`).
- Grupos com menos de 5 pessoas saem ocultos do banco, junto com o próximo menor do mesmo recorte, para que o total
  não revele o valor escondido.
- Só a coordenação acessa; o adm de unidade vê apenas as próprias unidades.
- Pessoas anonimizadas continuam nos números, sem identificação.
