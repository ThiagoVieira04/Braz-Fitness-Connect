# Academia Braz Fitness

Presença digital oficial da **Academia Braz Fitness**, em Piabetá, Magé/RJ. Reúne planos, modalidades, contato, localização, vídeos, depoimentos e informações de pagamento em um só lugar.

**[Acessar o Site](https://braz-fitness-connect.vercel.app/)**

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
| Modalidades e planos | Musculação, funcional, personal trainer, avaliação física, aulas coletivas, cardio e acompanhamento nutricional; planos incluem Jump, Step e Muay Thai |
| Por Dentro da Braz | Carrossel de imagens e vídeos da academia e dos treinos |
| Depoimentos | Carrossel de vídeos gerenciado pelo admin; termina um, o próximo entra sozinho |
| Tela cheia | Visualizador com play, volume, setas e avanço automático |
| Pix | Copia a chave Pix da academia ou escolhe o aplicativo do banco |
| Escolha seu banco | Abre o app do banco direto no celular, com fallback para a loja de aplicativos |
| WiFi Grátis | Rede `INET ACADEMIA BRAZ FITNESS 5G`, senha copiável e botão para abrir as configurações de Wi-Fi |
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

Os dados fixos de contato e integração ficam no objeto `CONFIG`, no início de `assets/js/script.js`. O conteúdo dos planos e carrosséis é gerenciado pelo painel:

```javascript
const CONFIG = {
    pixKey: '+5521987220665',
    whatsappPhone: '5521987220665',
    googleReviewUrl: 'https://g.page/r/CaYM7P8yGrWjEBE/review',
    instagramUrl: 'https://www.instagram.com/academiabrazfitness',
    facebookUrl: 'https://www.facebook.com/sidlaine.thomaz',
    pageUrl: 'https://braz-fitness-connect.vercel.app/',
    wifiPassword: 'Fit142025',
    wifiSSID: 'INET ACADEMIA BRAZ FITNESS 5G',
};
```

**Conteúdo e identidade da academia:**

- **Por Dentro da Braz** lê vídeos e imagens de `data/catalog.json`.
- **Depoimentos** lê vídeos de `data/testimonials.json`.
- Os dois carrosséis são atualizados pelo painel `/admin`; vídeos de depoimentos podem ser enviados do celular. Depois de alterar uma lista, salve para publicar a mudança.
- A página pública lê os arquivos JSON; a lista de depoimentos não fica mais fixa em `assets/js/script.js`.
- O endereço, os contatos, as redes sociais, o Pix e os dados de Wi-Fi acima devem corresponder às informações oficiais da Academia Braz Fitness.

---

## Estrutura

```
├── index.html              ← Página principal
├── admin.html              ← Painel administrativo
├── style.css               ← Estilos e temas
├── package.json            ← Dependências e comandos de validação/build
├── api/                    ← APIs serverless de login, conta, conteúdo, upload e recuperação
├── lib/                    ← Sessão, perfil admin e recuperação de senha
├── data/
│   ├── plans.json          ← Planos editáveis
│   ├── catalog.json        ← Mídias de "Por Dentro da Braz"
│   └── testimonials.json   ← Vídeos de depoimentos
├── assets/
│   ├── css/admin.css       ← Estilos do painel
│   ├── js/
│   │   ├── script.js       ← Interface pública, carrosséis e CONFIG
│   │   └── admin.js        ← Interface do painel
│   ├── img/                ← Logo, ícones e gifs
│   └── media/              ← Imagens e vídeos mantidos no repositório
├── manifest.json           ← PWA
├── vercel.json             ← Deploy na Vercel
├── web.config              ← Configuração IIS
├── robots.txt / sitemap.xml ← SEO
```

---

## Deploy

O projeto é publicado na Vercel e usa Node.js 24 para as funções serverless.

1. Importe `ThiagoVieira04/Braz-Fitness-Connect` na [Vercel](https://vercel.com).
2. Configure as variáveis de ambiente descritas abaixo e conecte um Vercel Blob público.
3. Faça o deploy. Commits enviados à branch configurada (por padrão `main`) iniciam novos deploys automaticamente.

Para validar localmente:

```bash
npm install
npm run check
npm test
```

`python -m http.server` serve apenas os arquivos estáticos; as APIs administrativas dependem do ambiente serverless e das variáveis de ambiente da Vercel.

---

## Painel Admin

A página `/admin` oferece as seções **Planos e Valores**, **Por Dentro da Braz**, **Depoimentos** e **Minha conta**:

- editar os planos exibidos no site (`data/plans.json`);
- gerenciar vídeos e imagens do carrossel **Por Dentro da Braz** (`data/catalog.json`);
- enviar vídeos do celular para **Depoimentos** e remover vídeos da lista publicada (`data/testimonials.json`);
- atualizar nome, usuário, e-mail de recuperação e senha do administrador.

Ao salvar conteúdo, o JSON correspondente é atualizado via commit no GitHub e a Vercel inicia um novo deploy. Vídeos e imagens enviados ficam no **Vercel Blob**; excluir um depoimento remove a referência do site, mas não apaga o arquivo do Blob.
O perfil do administrador é criptografado com `SESSION_SECRET` antes de ser salvo no GitHub. A senha inicial é configurada por `ADMIN_PASSWORD`; se alterada pelo painel, o hash é guardado dentro do perfil criptografado. Novas senhas devem ter de 12 a 128 caracteres. Os campos de senha do painel têm um controle para mostrar ou ocultar o valor.

Configure as variáveis de ambiente no painel da Vercel:

| Variável | Descrição |
|----------|-----------|
| `ADMIN_USER` | Usuário do admin |
| `ADMIN_NAME` | Nome inicial exibido no admin (opcional; por padrão usa `ADMIN_USER`) |
| `ADMIN_PASSWORD` | Senha inicial do admin (antes da primeira troca pelo painel) |
| `RESEND_API_KEY` | Chave da API do Resend para envio dos códigos de recuperação |
| `EMAIL_FROM` | Remetente verificado no Resend (por exemplo, `Braz Fitness <admin@seudominio.com>`) |
| `SESSION_SECRET` | String aleatória longa para assinar a sessão |
| `GITHUB_TOKEN` | PAT fine-grained com **Contents: Read and write** neste repositório |
| `GITHUB_REPO` | `ThiagoVieira04/Braz-Fitness-Connect` |
| `GITHUB_BRANCH` | `main` |
| `BLOB_READ_WRITE_TOKEN` | Token read-write do Vercel Blob (gerado ao conectar um Blob Store público ao projeto) |

Para habilitar a recuperação automática:

1. Crie uma conta no Resend e verifique um domínio/remetente para envio.
2. Configure `RESEND_API_KEY` e `EMAIL_FROM` na Vercel e faça um novo deploy.
3. Entre no painel, abra **Minha conta** e cadastre o e-mail de recuperação.

Os códigos expiram em 10 minutos, têm limite de tentativas e só podem ser usados uma vez. O projeto usa o endpoint de e-mail do Resend diretamente, sem dependência adicional.

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

Projeto digital oficial da **Academia Braz Fitness**

Desenvolvido por Papel e Sonhos Informatica
