# Registro das operações de tratamento

Registro simplificado de agente de tratamento de pequeno porte (LGPD, art. 37, e Res. CD/ANPD 2/2022, art. 9º).
Revisado em 6 de outubro de 2026.

- Controlador: Gabriel Rocha, pessoa natural, sem receita com o app.
- Contato do titular: gabrielrsilva203@gmail.com, o canal publicado na Política de Privacidade.
- Titulares: pessoas com 18 anos ou mais que criam conta com e-mail e senha.
- Operadores: Supabase (banco e login), Vercel (hospedagem) e GitHub (backup), pelos termos e DPAs de cada um.

| Dados | Finalidade | Base legal | Retenção | Compartilhamento | Transferência internacional |
| --- | --- | --- | --- | --- | --- |
| Conta: e-mail e hash bcrypt da senha | Criar a conta e entrar | Execução de contrato (art. 7º, V) | Até a exclusão da conta, que apaga tudo na hora; backup por mais 14 dias | Supabase (Auth) | Conta guardada no Brasil (sa-east-1); cópia nos EUA pelo backup |
| Lançamentos, cofrinhos, categorias e cartões digitados pelo usuário | Registrar gastos e mostrar análises e previsões | Execução de contrato (art. 7º, V) | Até o usuário apagar ou excluir a conta; lançamento apagado fica até 2 dias na lixeira e sai na limpeza diária; backup por mais 14 dias | Supabase (banco), Vercel (hospedagem) | Banco no Brasil (sa-east-1 e gru1); cópia nos EUA pelo backup (linha abaixo) |
| Sessão: cookies essenciais com token de acesso de 15 minutos e token de renovação; IP e navegador da sessão | Manter o login seguro | Legítimo interesse (art. 7º, IX) | Token de acesso: 15 minutos; sessão: até sair ou excluir a conta; fora do backup | Supabase (Auth) | Não |
| Backup cifrado da conta, dos dados financeiros e da lixeira, sem sessões | Recuperar o serviço depois de falha ou incidente | Execução de contrato (art. 7º, V) e dever de segurança (art. 46) | 14 dias | GitHub (artefato do Actions) | Sim, EUA: gerado e testado sem cifra num servidor temporário do GitHub, guardado cifrado com chave offline |
| Registros técnicos de acesso: IP, navegador, data e hora | Segurança e diagnóstico | Execução de contrato (art. 7º, V) | Padrão de cada fornecedor (1 dia no plano gratuito do Supabase) | Vercel, Supabase | Sim, EUA (art. 33, IX, com o art. 7º, V) |
| Registro de incidentes ([runbook](runbook.md)) | Cumprir a Res. CD/ANPD 15/2024 | Obrigação legal (art. 7º, II) | 5 anos | ANPD, quando o incidente for comunicado | Não |

Segurança: RLS em todas as tabelas expostas, senha só como hash bcrypt, limite de tentativas de login do Supabase, só
cookies essenciais, token de acesso de 15 minutos, backup cifrado com chave offline e segredos só no GitHub e na
Vercel.

## Por que não é alto risco (Res. CD/ANPD 2/2022, art. 4º)

1. Alto risco exige ao menos um critério geral e um critério específico do art. 4º.
2. Gerais: a base de usuários ainda é pequena, sem larga escala; afetar interesses e direitos fundamentais é tratado
   como possível, porque um vazamento de gastos poderia prejudicar o titular.
3. Específicos: nenhum se aplica. Não há tecnologia emergente, vigilância de área pública, dado sensível nem tratamento
   voltado a crianças, adolescentes ou idosos (a idade nem é coletada).
4. As sugestões de categoria e os avisos de gasto são cálculos simples mostrados só ao próprio usuário, sem decisão
   automatizada que o afete.
5. Conclusão: não é alto risco e o regime de pequeno porte se aplica. Reavaliar quando a base crescer ou se surgir
   perfilamento, dado sensível ou público menor de idade.
