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

```javascript
const CATALOG_MEDIA = [ /* vídeos do catálogo */ ];

const TESTIMONIALS_MEDIA = [
    { type: 'video', src: 'assets/media/videos/depo 1.mp4' },
    { type: 'video', src: 'assets/media/videos/depo 2.mp4' },
];
```

Salve, recarregue e pronto.

---

## Estrutura

```
├── index.html              ← Página principal
├── style.css               ← Estilos e temas
├── assets/
│   ├── js/script.js        ← Lógica, CONFIG e mídias
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

## Admin (Planos e Valores)

A página `/admin` permite editar os valores dos planos exibidos no site. Ao salvar, o arquivo `data/plans.json` é atualizado via commit no GitHub e a Vercel refaz o deploy automaticamente (~10s).

Configure as variáveis de ambiente no painel da Vercel:

| Variável | Descrição |
|----------|-----------|
| `ADMIN_USER` | Usuário do admin |
| `ADMIN_PASSWORD` | Senha do admin |
| `SESSION_SECRET` | String aleatória longa para assinar a sessão |
| `GITHUB_TOKEN` | PAT fine-grained com **Contents: Read and write** neste repositório |
| `GITHUB_REPO` | `ThiagoVieira04/Braz-Fitness-Connect` |
| `GITHUB_BRANCH` | `main` |

---

## Tecnologias

- HTML5 / CSS3 / JavaScript (sem framework)
- [Font Awesome 6](https://fontawesome.com/) — Ícones
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — QR Code
- [VLibras](https://vlibras.gov.br/) — Tradução de Libras

---

## Contato

- **WhatsApp:** [+55 21 98717-2463](https://wa.me/5521987172463)
- **WhatsApp comercial:** [+55 21 98722-0665](https://wa.me/5521987220665)
- **Pix:** +55 21 98859-3392
- **Instagram:** [@thomazsidlaine](https://www.instagram.com/thomazsidlaine)
- **Facebook:** [sidlaine.thomaz](https://www.facebook.com/sidlaine.thomaz)
- **Local:** Rua Guarani, nº 2334 — Piabetá, Magé/RJ

---

Desenvolvido por **Papel e Sonhos Informática**
