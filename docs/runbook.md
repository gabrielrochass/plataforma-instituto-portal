# Runbook de incidentes

Roteiro curto para incidentes de segurança com dados pessoais. O Contadinho é mantido por um agente de
tratamento de pequeno porte (Res. CD/ANPD 2/2022), por isso os prazos abaixo já estão em dobro.

## 1. Conter

Assim que houver suspeita de acesso indevido, troque as credenciais:

1. Supabase: crie uma nova secret key e apague a antiga, depois troque a senha do banco.
2. GitHub: atualize o secret `SUPABASE_DB_URL` com a nova senha.
3. Vercel: atualize `SUPABASE_SECRET_KEY` e qualquer outra variável trocada, depois faça um novo deploy.

## 2. Avaliar

Anote no registro (passo 4):

- quando você soube do incidente e o que aconteceu;
- quais dados e quantos titulares foram afetados;
- se há risco ou dano relevante para eles.

Os lançamentos são dados financeiros, um dos critérios de risco relevante da Res. CD/ANPD 15/2024. Na dúvida,
comunique.

## 3. Comunicar

Se houver risco ou dano relevante, comunique em até 6 dias úteis, contados de quando você soube que dados pessoais
foram afetados:

- ANPD: pelo formulário eletrônico de comunicação de incidente de segurança, no site da ANPD (gov.br/anpd).
- Titulares afetados: por e-mail, em linguagem simples, dizendo o que aconteceu, quais dados, os riscos, o que foi
  feito, o que eles podem fazer e como falar com você.

Se o incidente puder comprometer a integridade física ou moral dos titulares, o prazo cai para 3 dias úteis. O que
faltar na comunicação à ANPD pode ser complementado em até 40 dias úteis.

## 4. Registrar

Registre todo incidente, inclusive os que não foram comunicados, e guarde o registro por 5 anos, fora do repositório.
Inclua a data em que soube, o que aconteceu, os dados e o número de titulares afetados, a avaliação de risco, as
medidas tomadas e as comunicações feitas, ou por que não comunicou.

## Redefinir a senha de alguém

Não há envio de e-mail, então quem esquece a senha escreve para o canal de privacidade.

1. Confira que o pedido veio do e-mail da conta. Mesmo assim, responda sempre para o e-mail da conta, nunca para outro
   endereço indicado na mensagem.
2. Gere uma senha provisória longa e aleatória, por exemplo com o gerador do gerenciador de senhas.
3. Ache o id no SQL Editor (`select id from auth.users where email = '<e-mail>';`) e, na raiz do repositório, rode
   com a secret key de produção:

   ```bash
   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=<secret> node --input-type=module -e '
   import { createClient } from "@supabase/supabase-js";
   const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
   const { error } = await admin.auth.admin.updateUserById(process.argv[1], { password: process.argv[2] });
   console.log(error ?? "ok");' <id> <senha-provisória>
   ```

4. Encerre as sessões antigas: no SQL Editor, `delete from auth.sessions where user_id = '<id>';`.
5. Responda para o e-mail da conta com a senha provisória e peça que a pessoa troque em Ajustes, Conta,
   "Alterar senha".

## Restaurar o backup

O workflow Backup guarda toda noite, por 14 dias, um artefato cifrado com `schema.sql`, `data.sql` e `commit.txt`.
Restaure num projeto Supabase novo e vazio, configurado como na seção [Produção](../README.md#produção) do README.
Abaixo, `<novo>` é a URI do Session pooler desse projeto.

1. Baixe o artefato `backup-AAAAMMDD` em Actions > Backup, ou com `gh run download <id> -n backup-AAAAMMDD`.
2. Decifre com a chave offline (veja [Chaves](#chaves)) e extraia:

   ```bash
   age -d -i chave-backup.txt -o backup.tar.gz backup-AAAAMMDD.tar.gz.age
   tar -xzf backup.tar.gz
   ```

3. Recrie o schema no commit do backup:

   ```bash
   git switch --detach "$(cat commit.txt)"
   supabase db push --db-url "<novo>"
   ```

4. Carregue os dados (sem psql instalado, rode o mesmo comando num container `postgres:17`):

   ```bash
   psql "<novo>" --single-transaction -v ON_ERROR_STOP=1 -f data.sql
   ```

5. Volte para a `main` e rode `supabase db push --db-url "<novo>"` de novo, para aplicar as migrações mais novas que o
   backup.
6. Aponte o secret `SUPABASE_DB_URL` e as variáveis da Vercel para o projeto novo, faça um novo deploy de produção e
   apague os arquivos decifrados.

As sessões não entram no backup, então todos precisam entrar de novo.

## Chaves

- A chave privada do age fica só com o mantenedor do projeto, offline: no gerenciador de senhas e numa cópia fora do
  computador. Nunca no GitHub, na Vercel ou no repositório.
- O GitHub guarda só a chave pública, na variável `BACKUP_AGE_RECIPIENT`.
- Para gerar o par (no Windows, instale antes com `winget install FiloSottile.age`):

  ```bash
  age-keygen -o chave-backup.txt
  ```

  O comando mostra a chave pública (`age1...`), que vai na variável. Para vê-la de novo, use
  `age-keygen -y chave-backup.txt`. Guarde o arquivo offline e apague-o do disco.
- Teste a chave uma vez, decifrando um backup como no passo 2 acima.
- Se a chave privada vazar, gere outra, troque a variável e apague os backups antigos em Actions. Se ela se perder, os
  backups antigos ficam ilegíveis: gere outra e troque a variável.
