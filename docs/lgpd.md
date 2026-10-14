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
| Registro de incidentes ([runbook](runbook.md)) | Cumprir a Res. CD/ANPD 15/2024 | Obrigação legal (art. 7º, II) | 5 anos | ANPD, quando o incidente for comunicado | Não |

Segurança: RLS em todas as tabelas expostas, cadastro público desligado (só entra quem recebe convite), senha só como
hash bcrypt, limite de tentativas de login do Supabase, só cookies essenciais, token de acesso de 15 minutos, backup
cifrado com chave offline e segredos só no GitHub e na Vercel.

## Antes de registrar alunos

O tratamento passa a ser de alto risco (Res. CD/ANPD 2/2022, art. 4º): dados de crianças e adolescentes e dados
sensíveis (cor ou raça, saúde, deficiência) são critérios específicos. Por isso:

1. Elaborar o RIPD e nomear o encarregado.
2. Coletar consentimento específico de um dos pais ou responsável para menores (LGPD, art. 14) e consentimento
   específico para dados sensíveis (art. 11).
3. Limitar dados sensíveis à coordenação; professores veem só o necessário para a sala de aula.
4. Divulgar a patrocinadores apenas números agregados, escondendo grupos com menos de 5 pessoas.
5. Atualizar esta tabela, a Política de Privacidade e o runbook.
