# Academia Braz Fitness

Cartão de visita digital da academia em **Magé/RJ** — treinos, portfólio, depoimentos e pagamento Pix em um único link.

**[Acessar o Site](https://papel-e-sonhos-connect.vercel.app/)**

---

## Preview

<p align="center">
  <img src="assets/img/logo.jpeg" alt="Logo Academia Braz Fitness" width="30%">
</p>

> *"SEU OBJETIVO É A NOSSA MOTIVAÇÃO!"* — Ambiente acolhedor e motivador para você alcançar seus objetivos com saúde, respeito aos seus limites e valorização da sua evolução.

---

## O que tem dentro

| Bloco | Como funciona |
|-------|---------------|
| Avalie no Google | Abre a página de avaliação da academia |
| WhatsApp | Conversa direto pelo número da academia |
| Instagram / Facebook | Acompanhe as atualizações |
| Localização | Abre o endereço no Google Maps |
| Nossos Serviços | Accordion com musculação, treino funcional, personal trainer, avaliação física, crossfit, aulas coletivas, cardio e acompanhamento nutricional |
| Catálogo de Serviços | Carrossel de imagens e vídeos dos treinos |
| Depoimentos | Vídeos em carrossel — termina um, o próximo entra sozinho |
| Tela cheia | Visualizador com play, volume, setas e avanço automático |
| Pix | Copia a chave (Nubank, nome: Sidlaine Thomaz Nascimento) ou escolhe o banco |
| Escolha seu banco | Abre o app do banco direto no celular, com fallback para a loja de aplicativos |
| WiFi Grátis | Rede `SIDILAINE_THOMAZ-5G` com senha e botão "Conectar Agora" |
| QR Code | Gera QR Code da página para compartilhar |
| Acessibilidade | Tema claro/escuro, alto contraste e VLibras |
| PWA | Instala como aplicativo no celular |

---

## Como Rodar

Abrir direto no navegador:

```
duplo clique em index.html
```

Ou com servidor local:

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000`

---

## Como Personalizar

Tudo mora no topo de `assets/js/script.js`:

```javascript
const CONFIG = {
    pixKey: '+5521988593392',
    whatsappPhone: '5521987220665',
    googleReviewUrl: 'https://g.page/r/.../review',
    instagramUrl: 'https://www.instagram.com/thomazsidlaine',
    facebookUrl: 'https://www.facebook.com/sidlaine.thomaz',
    pageUrl: 'https://papel-e-sonhos-connect.vercel.app/',
    wifiPassword: 'sidy1206',
    wifiSSID: 'SIDILAINE_THOMAZ-5G',
};
```

**Trocar os vídeos:**

O carrossel **Por Dentro da Braz** é carregado de `data/catalog.json` (editável pelo painel `/admin`). O array em `assets/js/script.js` serve apenas como fallback caso o JSON não esteja disponível:

```javascript
const CATALOG_MEDIA = [ /* fallback do catálogo */ ];

const TESTIMONIALS_MEDIA = [
    { type: 'video', src: 'assets/media/videos/depo 1.mp4' },
    { type: 'video', src: 'assets/media/videos/depo 2.mp4' },
];
```

Para adicionar vídeos e imagens, prefira o painel `/admin` → **Por Dentro da Braz**.

---

## Estrutura

```
├── index.html              ← Página principal
├── admin.html              ← Painel administrativo
├── style.css               ← Estilos e temas
├── package.json            ← Dependência @vercel/blob
├── api/                    ← Funções serverless (login, planos, catálogo, upload)
├── lib/                    ← Sessão do admin
├── data/
│   ├── plans.json          ← Planos editáveis
│   └── catalog.json        ← Mídias de "Por Dentro da Braz"
├── assets/
│   ├── js/script.js        ← Lógica, CONFIG e fallback de mídias
│   ├── img/                ← Logo, ícones e gifs
│   └── media/videos/       ← Catálogo + depoimentos (depo 1, depo 2)
├── manifest.json           ← PWA
├── vercel.json             ← Deploy na Vercel
├── .htaccess / web.config  ← Apache e IIS
├── robots.txt / sitemap.xml ← SEO
```

---

## Deploy

1. Conecte o repositório ao [vercel.com](https://vercel.com)
2. Clique em **Deploy**

---

## Admin (Planos e Mídias)

A página `/admin` permite:
- editar os valores dos planos exibidos no site (`data/plans.json`);
- gerenciar o carrossel **Por Dentro da Braz** (`data/catalog.json`), adicionando vídeos e imagens por link (YouTube, Instagram, `.mp4`) ou por upload de arquivo.
- alterar o nome exibido no painel e o usuário de acesso, confirmando com a senha atual.

Ao salvar, o JSON correspondente é atualizado via commit no GitHub e a Vercel refaz o deploy automaticamente (~10s). Os arquivos enviados pelo painel são armazenados no **Vercel Blob** (não incham o repositório).
O perfil do administrador é criptografado com `SESSION_SECRET` antes de ser salvo no GitHub. A senha inicial é configurada por `ADMIN_PASSWORD`; se alterada pelo painel, o hash é guardado dentro do perfil criptografado. Novas senhas devem ter de 12 a 128 caracteres.

Configure as variáveis de ambiente no painel da Vercel:

| Variável | Descrição |
|----------|-----------|
| `ADMIN_USER` | Usuário do admin |
| `ADMIN_NAME` | Nome inicial exibido no admin (opcional; por padrão usa `ADMIN_USER`) |
| `ADMIN_PASSWORD` | Senha inicial do admin (antes da primeira troca pelo painel) |
| `SESSION_SECRET` | String aleatória longa para assinar a sessão |
| `GITHUB_TOKEN` | PAT fine-grained com **Contents: Read and write** neste repositório |
| `GITHUB_REPO` | `ThiagoVieira04/Braz-Fitness-Connect` |
| `GITHUB_BRANCH` | `main` |
| `BLOB_READ_WRITE_TOKEN` | Token read-write do Vercel Blob (gerado ao conectar um Blob Store público ao projeto) |

### Uploads (Vercel Blob)

1. No painel da Vercel, abra **Storage → Create → Blob**.
2. Escolha acesso **Public** e conecte ao projeto.
3. Marque **Add a read-write token env var to this connection** (cria `BLOB_READ_WRITE_TOKEN`).
4. Faça o deploy. No admin, use **Enviar arquivo** em cada mídia.

> O cliente de upload do navegador é versionado em `assets/js/vendor/vercel-blob-client.mjs`. Para regenerá-lo após atualizar `@vercel/blob`, rode `npm run build:blob-client`.

---

## Tecnologias

- HTML5 / CSS3 / JavaScript (sem framework)
- [Font Awesome 6](https://fontawesome.com/) — Ícones
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — QR Code
- [VLibras](https://vlibras.gov.br/) — Tradução de Libras
- [Vercel Blob](https://vercel.com/docs/vercel-blob) — Upload de vídeos e imagens do admin

---

## Contato

- **WhatsApp:** [+55 21 98717-2463](https://wa.me/5521987172463)


---

Desenvolvido por **Papel e Sonhos Informática**
