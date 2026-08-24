# 🚛 Fleet Manager — Frontend (Angular)

Interface web do sistema de **Gestão de Frotas**, desenvolvida em **Angular**. Consome a API REST do backend (Spring Boot) para gerir veículos, motoristas, rotas, viagens, abastecimentos, manutenções, custos, rastreamento em tempo real (via WebSocket e Google Maps) e autenticação de utilizadores.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Capturas de Ecrã](#-capturas-de-ecrã)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Configuração](#-configuração)
- [Como Executar](#-como-executar)
  - [Com Docker](#-com-docker)
  - [Localmente sem Docker](#-localmente-sem-docker)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Consumo da API e Autenticação](#-consumo-da-api-e-autenticação)
- [Tracking em Tempo Real no Mapa](#-tracking-em-tempo-real-no-mapa)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🧭 Visão Geral

Este projeto é a interface web (SPA) do **Fleet Manager**, responsável por toda a interação visual do utilizador com o sistema de gestão de frotas. Ele consome os endpoints REST e o canal WebSocket disponibilizados pelo [backend em Spring Boot](#), apresentando os dados de forma organizada em painéis (dashboards), formulários e mapas interativos.

---

## 🖼️ Capturas de Ecrã



### 🔐 Login e Recuperação de Senha
<img width="955" height="491" alt="image" src="https://github.com/user-attachments/assets/c184e5f6-a732-4678-803b-03e11b8e570e" />

<img width="1600" height="880" alt="image" src="https://github.com/user-attachments/assets/13218809-6aa9-4b8b-84b6-4c79e6ab03f1" />

<img width="1600" height="884" alt="image" src="https://github.com/user-attachments/assets/9762b739-5e89-4d49-be50-54d7548d8c73" />

Tela de autenticação do sistema. Permite ao utilizador iniciar sessão com e-mail e senha, ou solicitar a recuperação de senha (envio de código por e-mail).

---

### 📊 Dashboard Principal
<img width="1600" height="899" alt="image" src="https://github.com/user-attachments/assets/c1e387e8-0d39-4c33-acd7-11f56e37da0b" />


Visão geral da frota: número de veículos ativos, viagens em curso, alertas de manutenção pendentes e resumo de custos do período.

---

### 🚗 Gestão de Veículos
<img width="1600" height="896" alt="image" src="https://github.com/user-attachments/assets/d93eff4e-869c-4479-9e26-2f9ce8464a53" />


Listagem, cadastro, edição e desativação de veículos da frota (placa, modelo, marca, ano, quilometragem, estado atual).

---

### 👨‍✈️ Gestão de Motoristas
<img width="1600" height="885" alt="image" src="https://github.com/user-attachments/assets/86d7723d-0946-4dcd-abe9-0ee91d7e3930" />


Cadastro e consulta de motoristas, incluindo dados da carta de condução, disponibilidade e histórico de viagens.

---

### 🗺️ Gestão de Rotas
<img width="1600" height="866" alt="image" src="https://github.com/user-attachments/assets/d5a8764b-f276-4bfe-a0c2-f52a26fbf557" />


Criação e visualização de rotas, com origem, destino e paragens intermédias, exibidas no mapa.

---

### 🧳 Gestão de Viagens
<img width="1600" height="843" alt="image" src="https://github.com/user-attachments/assets/642ccbde-c270-4cc7-995a-e92ad3ea593e" />


Registo de viagens, associando motorista, veículo e rota, com datas de início/fim e status (em curso, concluída, cancelada).

---

### ⛽ Gestão de Abastecimentos
<img width="1600" height="899" alt="image" src="https://github.com/user-attachments/assets/e9a57a80-6c7e-4bd7-8fbf-f38ecc647cb8" />


Registo de abastecimentos por veículo: litros, valor pago, posto de combustível e quilometragem no momento do abastecimento.

---

### 🔧 Gestão de Manutenções
<img width="1600" height="844" alt="image" src="https://github.com/user-attachments/assets/9e5e04b8-6ef9-4a5a-b980-c8b7bf592177" />

<img width="1600" height="746" alt="image" src="https://github.com/user-attachments/assets/70966fc2-6c2e-45d6-bb72-5a09bf4dce98" />

Histórico de manutenções preventivas e corretivas por veículo, com agendamento de próximas manutenções e alertas visuais para as que estão vencidas ou próximas.

---

### 💰 Relatório de Custos


Painel consolidado de custos operacionais (combustível + manutenção + outros), filtrável por veículo, motorista ou período.

---

### 📍 Tracking em Tempo Real
<!-- ![Tracking](docs/screenshots/tracking.png) -->
`[ imagem: docs/screenshots/tracking.png ]`

Mapa (Google Maps) com a localização em tempo real dos veículos da frota, atualizada automaticamente via WebSocket.

---

## ⚙️ Funcionalidades

| Módulo | Descrição |
|---|---|
| 🔐 **Autenticação** | Login, logout, proteção de rotas (guards) e recuperação de senha via código enviado por e-mail |
| 🚗 **Veículos** | CRUD completo de veículos da frota |
| 👨‍✈️ **Motoristas** | CRUD completo de motoristas |
| 🗺️ **Rotas** | Criação e visualização de rotas no mapa |
| 🧳 **Viagens** | Registo e acompanhamento de viagens |
| ⛽ **Abastecimentos** | Registo e histórico de abastecimentos |
| 🔧 **Manutenções** | Histórico, agendamento e alertas visuais de manutenções |
| 💰 **Custos** | Dashboards e relatórios de custos consolidados |
| 📍 **Tracking** | Rastreamento em tempo real dos veículos no Google Maps via WebSocket |

---

## 🛠️ Tecnologias

- **Angular** (informar a versão, ex.: Angular 17+)
- **TypeScript**
- **Angular Material** / **Bootstrap** (ajustar conforme o que usas na UI)
- **RxJS** — programação reativa e streams do WebSocket
- **@angular/google-maps** ou **Google Maps JavaScript API** — exibição do mapa e tracking
- **SockJS + STOMP.js** — conexão WebSocket em tempo real com o backend
- **Angular Router** — navegação e proteção de rotas (Auth Guards)
- **Reactive Forms** — formulários de cadastro/edição
- **Interceptors HTTP** — anexação automática do token JWT nas requisições
- **Docker** — contentorização da aplicação (build + Nginx)

> Ajusta esta lista conforme as bibliotecas reais usadas no teu `package.json`.

---

## 📁 Estrutura do Projeto

```
fleet-manager-frontend/
├── src/
│   ├── app/
│   │   ├── core/                  # Serviços singleton, interceptors, guards
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   ├── shared/                 # Componentes, pipes e diretivas reutilizáveis
│   │   ├── auth/                   # Login, recuperação de senha
│   │   ├── veiculos/                # Módulo de veículos
│   │   ├── motoristas/              # Módulo de motoristas
│   │   ├── rotas/                   # Módulo de rotas
│   │   ├── viagens/                 # Módulo de viagens
│   │   ├── abastecimentos/          # Módulo de abastecimentos
│   │   ├── manutencoes/             # Módulo de manutenções
│   │   ├── custos/                  # Módulo de custos
│   │   ├── tracking/                # Módulo de rastreamento (mapa + WebSocket)
│   │   ├── app-routing.module.ts
│   │   └── app.module.ts
│   ├── assets/
│   │   └── screenshots/            # Imagens usadas neste README
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── index.html
├── docs/
│   └── screenshots/                 # (alternativa) imagens do README
├── angular.json
├── package.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

> Ajusta os nomes das pastas conforme a organização real do teu projeto (ex.: se usas Standalone Components em vez de módulos por feature).

---

## ✅ Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ e npm
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)
- [Docker](https://www.docker.com/) e Docker Compose (opcional, para execução contentorizada)
- Backend do Fleet Manager a correr (localmente ou via Docker) — ver README do backend
- Uma chave de API do **Google Maps** (Maps JavaScript API)

---

## 🔧 Configuração

Edita os ficheiros de ambiente em `src/environments/` com a URL da API e a chave do Google Maps:

**`src/environments/environment.ts`** (desenvolvimento)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'http://localhost:8080/ws/tracking',
  googleMapsApiKey: 'SUA_CHAVE_GOOGLE_MAPS'
};
```

**`src/environments/environment.prod.ts`** (produção)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.seudominio.com/api',
  wsUrl: 'https://api.seudominio.com/ws/tracking',
  googleMapsApiKey: 'SUA_CHAVE_GOOGLE_MAPS'
};
```

---

## 🚀 Como Executar

### 🐳 Com Docker

**1. Clona o repositório**
```bash
git clone https://github.com/teu-usuario/fleet-manager-frontend.git
cd fleet-manager-frontend
```

**2. Sobe o contentor**
```bash
docker-compose up --build
```

A aplicação estará disponível em: `http://localhost:4200` (ou na porta configurada)

**3. Para parar**
```bash
docker-compose down
```

#### Exemplo de `Dockerfile` (build + Nginx)

```dockerfile
# Etapa de build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa de produção
FROM nginx:alpine
COPY --from=build /app/dist/fleet-manager-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Exemplo de `docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build: .
    container_name: fleet-manager-frontend
    ports:
      - "4200:80"
    networks:
      - fleet-network

networks:
  fleet-network:
    driver: bridge
    external: true
```

> Se o backend também usa `docker-compose`, considera unificar as duas aplicações na mesma rede Docker (`fleet-network`) para que se comuniquem entre contentores.

---

### 💻 Localmente sem Docker

**1. Instala as dependências**
```bash
npm install
```

**2. Configura o `environment.ts`** com a URL correta do backend.

**3. Executa em modo desenvolvimento**
```bash
ng serve
```
ou
```bash
npm start
```

A aplicação ficará disponível em `http://localhost:4200`.

**4. Gera o build de produção**
```bash
ng build --configuration production
```
Os ficheiros finais ficam em `dist/fleet-manager-frontend`.

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm start` / `ng serve` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm test` | Executa os testes unitários (Karma/Jasmine) |
| `npm run lint` | Verifica o código com ESLint |
| `npm run e2e` | Executa os testes end-to-end (se configurado) |

---

## 🔑 Consumo da API e Autenticação

- Todas as requisições HTTP passam por um **Interceptor** que anexa automaticamente o token JWT (obtido no login) no cabeçalho `Authorization`.
- Rotas protegidas usam **Auth Guards**, redirecionando para o login caso o utilizador não esteja autenticado ou o token tenha expirado.
- O fluxo de recuperação de senha consome os endpoints `/api/auth/recuperar-senha` e `/api/auth/redefinir-senha` do backend, que envia o código por e-mail via SMTP.

---

## 📍 Tracking em Tempo Real no Mapa

O módulo de **Tracking**:

1. Estabelece uma conexão **WebSocket** (STOMP sobre SockJS) com o endpoint `/ws/tracking` do backend;
2. Subscreve-se ao tópico de localização dos veículos;
3. Atualiza dinamicamente os marcadores no componente **Google Maps**, sem necessidade de recarregar a página, sempre que uma nova coordenada é recebida.

---

## 🤝 Contribuição

1. Faz um fork do projeto
2. Cria uma branch para a tua feature (`git checkout -b feature/minha-feature`)
3. Faz commit das tuas alterações (`git commit -m 'Adiciona minha feature'`)
4. Faz push para a branch (`git push origin feature/minha-feature`)
5. Abre um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT — sinta-se à vontade para usar, modificar e distribuir.

---

**Desenvolvido com 💙 e Angular.**
