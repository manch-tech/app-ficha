# M P - Ficha de Qualificação

Sistema de geração de códigos e fichas de qualificação.

## Estrutura
- `index.html` - Página do cliente (formulário)
- `adm.html` - Painel administrativo
- `shared.js` - Lógica compartilhada + sync Supabase opcional
- `ficha/termo.html` - Termo de conflito

## Como hospedar no GitHub Pages (grátis)

1. Crie um repositório no GitHub: `manoel-pedra-ficha`
2. Faça upload de todos os arquivos deste projeto
3. Vá em Settings > Pages > Branch: main / root > Save
4. Seu link será: `https://SEU_USUARIO.github.io/manoel-pedra-ficha/`

O app funciona 100% com localStorage, sem precisar de backend.

## Como ativar Supabase (opcional, para salvar na nuvem)

1. Crie projeto em supabase.com
2. Rode o arquivo `supabase.sql` no SQL Editor
3. Pegue URL e anon key em Project Settings > API
4. Abra `shared.js` e preencha:

```js
const SUPABASE_CONFIG = {
  url: "https://xxxx.supabase.co",
  anonKey: "sua anon key",
  enabled: true
};
```

5. Faça commit e push. Agora tudo que você cadastrar no admin vai para o Supabase automaticamente, sem quebrar o app.

## PWA / App

Para transformar em app instalável, já tem manifest? Adicione no index.html:

```html
<link rel="manifest" href="manifest.json">
```

## Suporte
Qualquer erro, abra o console (F12) e veja os logs [Supabase]
