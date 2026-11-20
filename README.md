# 🎓 Trivium
> **Plataforma de Estudos Gamificada e Inteligente (PWA)**

O **Trivium** é um ambiente educacional moderno projetado para transformar a forma como alunos e professores interagem com o aprendizado. Unindo ferramentas formais de ensino com um ecossistema completo de gamificação e curadoria por Inteligência Artificial, a plataforma busca maximizar o engajamento e a organização dos estudos.

---

## 🚀 Tecnologias Utilizadas

O projeto foi construído com uma stack moderna, com foco em performance e experiência *mobile-first*:

*   **Front-end:** React + Vite (JavaScript)
*   **Back-end & BaaS:** Supabase (PostgreSQL, Auth, Storage)
*   **Serverless:** Supabase Edge Functions (Deno)
*   **Inteligência Artificial:** Google Gemini API
*   **Integrações:** YouTube Data API
*   **Arquitetura:** PWA (Progressive Web App) instalável

---

## ✨ Principais Funcionalidades

O Trivium opera com dois papéis de usuário distintos, entregando uma experiência personalizada para cada necessidade.

### 👥 Perfis de Acesso
*   **👨‍🏫 Professor:** Possui controle total para criar turmas, gerar códigos de acesso seguros, elaborar atividades formais detalhadas e gerenciar o lançamento de notas das entregas.
*   **👩‍🎓 Aluno:** Acessa um painel dinâmico focado no seu desenvolvimento, com ferramentas de estudo integradas a um sistema de progressão contínua.

### 🎮 Gamificação Profunda (XP Ledger)
Para manter os alunos motivados, o Trivium possui um motor de gamificação completo:
*   **Progressão de Nível:** Ações na plataforma (entregar atividades, interagir com o sistema) rendem **XP**, calculados de forma segura no back-end, permitindo que o aluno suba de nível.
*   **Conquistas (Badges):** Desafios específicos que recompensam o aluno com medalhas virtuais ao serem concluídos.
*   **Rankings:** Tabelas de classificação (Leaderboards) gerais e semanais por turma, promovendo uma competição saudável.
*   **Economia Social:** Um sistema de indicação de amigos que recompensa o aluno com XP bônus.

### 🎨 Customização de Perfil
Os alunos podem expressar sua identidade na plataforma através de itens cosméticos:
*   Personalização de **Avatar, Moldura, Capa e Título**.
*   *Mecânica de desbloqueio:* Itens mais raros ou avançados exigem que o aluno alcance determinados níveis, incentivando o estudo contínuo.

### 🤖 Curadoria Inteligente com IA
A plataforma atua como um assistente de estudos proativo:
*   Através de **Edge Functions** seguras, o Trivium conecta a IA do **Google Gemini** com a API do **YouTube**.
*   Ao criar um tópico de estudo, a IA analisa o contexto e busca, filtra e recomenda automaticamente as melhores videoaulas disponíveis, poupando o tempo de pesquisa do aluno.

### 📝 Ferramentas de Estudo Avançadas
*   **Editor por Blocos:** Um editor de notas robusto, no estilo *Notion*, que permite aos alunos criar resumos e cadernos estruturados, modulares e ricos em formatação.
*   **Calendário Pessoal:** Gestão de tempo integrada para organização de eventos de estudo individuais.

---

## ⚙️ Estrutura de Back-end e Segurança

A lógica de negócios e a segurança dos dados são garantidas diretamente na camada do banco de dados (Supabase/PostgreSQL):
*   **Row Level Security (RLS):** Políticas rígidas garantem que alunos só acessem seus próprios dados e interajam apenas com as turmas em que estão matriculados.
*   **Security Definer Functions:** Toda a transação de XP (Ledger) e atribuição de conquistas ocorre através de funções seguras (Triggers/RPCs) no banco, impedindo que usuários manipulem seus próprios níveis ou pontuações via front-end.
*   **Storage Otimizado:** Bucket dedicado para o armazenamento seguro de imagens, submissões de atividades e personalizações de perfil.

---

**Desenvolvido por Gabriel Vasconcelos Franco Martins**  
*Engenharia de Software*
