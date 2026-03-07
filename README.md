# 🏐 Soos Ruins — Sistema de Sorteio de Times de Vôlei

Sistema web completo para sorteio equilibrado de times de vôlei com algoritmo de balanceamento automático.

---

## 🛠️ Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Prisma ORM**
- **Supabase** (PostgreSQL)
- **Zod** (validação)
- **React Hook Form**
- **html2canvas** (captura de imagem)

---

## 📁 Estrutura do Projeto

```
soos_ruins/
├── app/
│   ├── api/
│   │   └── players/
│   │       ├── route.ts          # GET, POST
│   │       └── [id]/route.ts     # GET, PUT, DELETE
│   ├── dashboard/
│   │   ├── layout.tsx            # Sidebar navigation
│   │   └── page.tsx              # Home com estatísticas
│   ├── players/
│   │   ├── layout.tsx
│   │   └── page.tsx              # CRUD de jogadores
│   ├── draw/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Sorteio de times
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── PlayersClient.tsx         # Interface CRUD
│   └── DrawClient.tsx            # Interface de sorteio
├── lib/
│   ├── prisma.ts                 # Prisma singleton
│   └── drawService.ts            # Algoritmo de balanceamento
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/
│   └── index.ts
├── .env.example
└── package.json
```

---

## 🚀 Configuração Local

### 1. Clone e instale dependências

```bash
git clone <repo>
cd soos_ruins
npm install
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **Settings → Database → Connection string**
3. Copie as duas strings de conexão

### 3. Configure variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 4. Configure o banco de dados

```bash
# Gera o Prisma Client
npm run db:generate

# Aplica o schema ao banco
npm run db:push

# (Opcional) Popula com dados de teste
npx ts-node prisma/seed.ts
```

### 5. Inicie o servidor

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy na Vercel

### 1. Prepare o repositório

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/seu-usuario/soos-ruins.git
git push -u origin main
```

### 2. Configure na Vercel

1. Acesse [vercel.com](https://vercel.com) → **New Project**
2. Importe o repositório do GitHub
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → string com `?pgbouncer=true`
   - `DIRECT_URL` → string sem pgbouncer (porta 5432)
4. Clique em **Deploy**

> ⚠️ **Importante**: Após o primeiro deploy, rode `npm run db:push` localmente com as mesmas variáveis de produção para garantir que o schema está aplicado.

---

## 🎯 Funcionalidades

### Jogadores (`/players`)
- ✅ Listar com busca e filtro por posição
- ✅ Ordenação por nome, nível, posição
- ✅ Criar jogador com modal
- ✅ Editar jogador
- ✅ Excluir com confirmação
- ✅ Barra visual de nível (0-10)
- ✅ Badge de capitão

### Sorteio (`/draw`)
- ✅ Configuração de número de times (2-6)
- ✅ Configuração de jogadores por time (4-8)
- ✅ Seleção individual de participantes
- ✅ Seleção rápida (todos/nenhum/capitães)
- ✅ Algoritmo de balanceamento por nível
- ✅ Cards de resultado por time
- ✅ Indicador de diferença de nível
- ✅ Copiar resultado em texto
- ✅ Capturar imagem (html2canvas)
- ✅ Sortear novamente

---

## ⚙️ Algoritmo de Balanceamento

1. Capitães são separados e distribuídos aleatoriamente (um por time)
2. Jogadores restantes são agrupados por nível (maior → menor)
3. Atribuição greedy: cada jogador vai para o time com menor soma de nível
4. Isso minimiza a diferença total entre os times

---

## 📝 Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia produção
npm run db:generate  # Gera Prisma Client
npm run db:push      # Aplica schema ao banco
npm run db:studio    # Abre Prisma Studio (GUI do banco)
```
