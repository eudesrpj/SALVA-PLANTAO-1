# 📑 ÍNDICE CENTRAL - NAVEGAÇÃO DE DOCUMENTOS

**Investigação completa do projeto Salva Plantão**  
**Data:** 1º de fevereiro de 2026  
**Status:** 100% concluso - Pronto para deploy

---

## 🎯 COMECE AQUI

### Para Ação Rápida (1 minuto)
→ **[SUMARIO_EXECUTIVO.md](SUMARIO_EXECUTIVO.md)**
- O que foi investigado
- Timeline (60-65 minutos total)
- Próximas ações
- Checklist final

### Para Executar Agora (60 minutos)
→ **[PROXIMAS_ACOES_PASSO_A_PASSO.md](PROXIMAS_ACOES_PASSO_A_PASSO.md)**
- PASSO 1: Google Cloud Console (15 min)
- PASSO 2: Asaas Setup (10 min)
- PASSO 3: Deploy com gcloud (15 min)
- PASSO 4: 6 Testes E2E (20 min)
- PASSO 5: Verificação Final (5 min)

### Para Lookup Rápido (2 minutos)
→ **[REFERENCIA_RAPIDA.md](REFERENCIA_RAPIDA.md)**
- Tabela de rotas
- Env vars
- Gcloud commands
- URLs para Google Console

### Para Validação Completa (20 minutos)
→ **[VALIDACAO_FINAL_EXATA.md](VALIDACAO_FINAL_EXATA.md)**
- 1️⃣ Rotas Google OAuth (localização exata)
- 2️⃣ Base path `/api` confirmado
- 3️⃣ Dev server ports (5000, 5173)
- 4️⃣ Domínio de produção
- 5️⃣ Lista para Google Console
- 6️⃣ Asaas webhook (path, headers, env vars)
- 7️⃣ Gcloud commands prontos

### Para Investigação Profunda (45 minutos)
→ **[INVESTIGACAO_COMPLETA.md](INVESTIGACAO_COMPLETA.md)**
- PASSO 1: Rotas Google OAuth (código exato)
- PASSO 2: Configuração Google OAuth
- PASSO 3: Webhook Asaas (implementação)
- PASSO 4: Cloud Run setup
- PASSO 5: Gcloud commands
- PASSO 6: Testes end-to-end

---

## 📚 ARQUIVOS DE SUPORTE

### [CHECKLIST_COMANDOS.md](CHECKLIST_COMANDOS.md)
- CHECKLIST 1: Google Cloud Console
- CHECKLIST 2: Asaas Dashboard
- CHECKLIST 3: Variáveis de Ambiente
- COMANDO 1-3: Deploy e verificação
- TESTE 1-6: Testes prontos para rodar
- TROUBLESHOOTING: Soluções rápidas

---

## 🗂️ FLUXO RECOMENDADO POR PERFIL

### Executivo / Manager
```
1. SUMARIO_EXECUTIVO.md (5 min)
2. PROXIMAS_ACOES_PASSO_A_PASSO.md (20 min overview)
3. Pronto para delegarações
```

### DevOps / Implementador
```
1. VALIDACAO_FINAL_EXATA.md (20 min)
2. PROXIMAS_ACOES_PASSO_A_PASSO.md (60 min execução)
3. REFERENCIA_RAPIDA.md (consulta durante implementação)
4. INVESTIGACAO_COMPLETA.md (troubleshooting se necessário)
```

### Desenvolvedor Backend
```
1. INVESTIGACAO_COMPLETA.md (45 min study)
2. VALIDACAO_FINAL_EXATA.md (validation)
3. REFERENCIA_RAPIDA.md (daily reference)
```

### QA / Tester
```
1. PROXIMAS_ACOES_PASSO_A_PASSO.md - PASSO 4 (Testes)
2. CHECKLIST_COMANDOS.md - Seção TESTE 1-6
3. REFERENCIA_RAPIDA.md - Seção "Testes Rápidos"
```

---

## 🎯 MAPA DE NAVEGAÇÃO

```
┌─────────────────────────────────────────────────────────────┐
│                  INVESTIGAÇÃO COMPLETA                      │
│              (100% Código Validado)                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   EXECUTIVA              OPERACIONAL
   (Visão geral)          (Implementação)
        │                     │
   SUMARIO_EXEC.md      PROXIMAS_ACOES.md
   CHECKLIST: Go?       PASSO 1-5
        │                     │
        └──────────┬──────────┘
                   │
             ▼─────────────▼
         LOOKUP RÁPIDO
         REFERENCIA_RAPIDA.md
         (Durante execução)
             │
        Dúvidas?
             │
      ▼──────────────▼
      VALIDACAO_EXATA
      ou
      INVESTIGACAO_COMPLETA
```

---

## 📊 ESTRUTURA DOS DOCUMENTOS

```
SUMARIO_EXECUTIVO (340 linhas)
├─ O que foi investigado
├─ Resumo das descobertas (tabela)
├─ Arquivos criados nesta investigação (resumo)
├─ Próximas ações (roadmap)
├─ Timeline total
└─ Checklist final

PROXIMAS_ACOES_PASSO_A_PASSO (572 linhas)
├─ PASSO 1: Google Cloud Console (15 min)
├─ PASSO 2: Asaas Setup (10 min)
├─ PASSO 3: Deploy com gcloud (15 min)
├─ PASSO 4: Testes E2E (20 min)
├─ PASSO 5: Verificação Final (5 min)
└─ Troubleshooting

VALIDACAO_FINAL_EXATA (458 linhas)
├─ Rotas Google OAuth (arquivo + linha exata)
├─ Base path /api confirmado
├─ Dev servers (5000, 5173)
├─ Domínio produção
├─ Lista para Google Console
├─ Webhook Asaas (path + headers)
└─ Gcloud commands

REFERENCIA_RAPIDA (260 linhas)
├─ Tabela de rotas
├─ Env vars completas
├─ Gcloud commands um-liner
├─ URLs para Google Console
├─ Testes rápidos
└─ Checklist

INVESTIGACAO_COMPLETA (1517 linhas)
├─ PASSO 1: Google OAuth Routing
├─ PASSO 2: Google OAuth Config
├─ PASSO 3: Webhook Asaas
├─ PASSO 4: Cloud Run Config
├─ PASSO 5: Deploy Commands
└─ PASSO 6: Test Scenarios

CHECKLIST_COMANDOS (506 linhas)
├─ CHECKLIST 1: Google Console
├─ CHECKLIST 2: Asaas
├─ CHECKLIST 3: Env Vars
├─ COMANDO 1-3: Deploy
├─ TESTE 1-6: Testes
└─ TROUBLESHOOTING
```

---

## 🔍 BUSCA POR TÓPICO

### Google OAuth
- Rotas exatas: **VALIDACAO_FINAL_EXATA.md** - Seção 1
- Passo a passo: **PROXIMAS_ACOES_PASSO_A_PASSO.md** - PASSO 1 + PASSO 4 (TESTE 2)
- Checklist: **CHECKLIST_COMANDOS.md** - CHECKLIST 1
- Investigação: **INVESTIGACAO_COMPLETA.md** - PASSO 1-2
- Lookup: **REFERENCIA_RAPIDA.md** - Seção "Google OAuth"

### Asaas
- Path exato: **VALIDACAO_FINAL_EXATA.md** - Seção 6
- Passo a passo: **PROXIMAS_ACOES_PASSO_A_PASSO.md** - PASSO 2 + PASSO 4 (TESTE 4)
- Checklist: **CHECKLIST_COMANDOS.md** - CHECKLIST 2
- Investigação: **INVESTIGACAO_COMPLETA.md** - PASSO 3
- Lookup: **REFERENCIA_RAPIDA.md** - Seção "Webhook Asaas"

### Deploy
- Commands: **VALIDACAO_FINAL_EXATA.md** - Seção 7
- Passo a passo: **PROXIMAS_ACOES_PASSO_A_PASSO.md** - PASSO 3
- Checklist: **CHECKLIST_COMANDOS.md** - COMANDO 1-3
- Lookup: **REFERENCIA_RAPIDA.md** - Seção "Gcloud Deploy"

### Testes
- Todos os 6: **PROXIMAS_ACOES_PASSO_A_PASSO.md** - PASSO 4
- Commands: **CHECKLIST_COMANDOS.md** - TESTE 1-6
- Quick: **REFERENCIA_RAPIDA.md** - Seção "Testes Rápidos"
- Detalhado: **INVESTIGACAO_COMPLETA.md** - PASSO 6

### Troubleshooting
- Rápido: **PROXIMAS_ACOES_PASSO_A_PASSO.md** - Seção "Troubleshooting Rápido"
- Completo: **CHECKLIST_COMANDOS.md** - Seção "TROUBLESHOOTING"
- Lookup: **REFERENCIA_RAPIDA.md** - Seção "Troubleshooting"

---

## ⏱️ TEMPO DE LEITURA POR DOCUMENTO

| Documento | Tempo | Caso de Uso |
|---|---|---|
| SUMARIO_EXECUTIVO.md | 5 min | Overview rápida |
| REFERENCIA_RAPIDA.md | 2 min | Lookup durante execução |
| PROXIMAS_ACOES_PASSO_A_PASSO.md | 60 min | Implementação completa |
| VALIDACAO_FINAL_EXATA.md | 20 min | Validação técnica |
| INVESTIGACAO_COMPLETA.md | 45 min | Análise profunda |
| CHECKLIST_COMANDOS.md | 15 min | Execução de testes |

**Total leitura:** 147 minutos (≈2.5 horas)  
**Total implementação:** 60-65 minutos  
**Total (leitura + implementação):** 2.5-3 horas

---

## ✅ VERIFICAÇÃO DE CONCLUSÃO

Depois de ler todos os documentos, você deve saber:

- ✅ Exatamente onde estão as rotas de Google OAuth (arquivo + linha)
- ✅ Qual é o path exato do webhook Asaas
- ✅ Quais são as 6 variáveis de ambiente necessárias
- ✅ Como registrar origins no Google Console
- ✅ Como registrar redirect URIs no Google Console
- ✅ Como gerar API Key no Asaas
- ✅ Como registrar webhook no Asaas
- ✅ Como fazer deploy com `gcloud run deploy`
- ✅ Como rodar os 6 testes E2E
- ✅ Como troubleshoot erros comuns

Se SIM em todos → Você está pronto para começar! 🚀

---

## 📌 AVISOS IMPORTANTES

### ⚠️ Leia Antes de Começar

1. **Segurança de Credenciais**
   - Nunca commite Client Secret, API Keys, Webhook Token
   - Use Cloud Secret Manager para prod
   - Guardar localmente apenas durante setup

2. **Ordem é Importante**
   - Google Console ANTES de deploy
   - Asaas ANTES de webhook funcionar
   - Deploy ANTES dos testes

3. **Aguarde Delays**
   - Google Console: 5 min para ativar
   - Cloud Run: 2-3 min para deploy ficar ativo
   - Asaas: 1-2 min para webhook estar pronto

4. **URLs Exatas**
   - Sem trailing slash
   - Verificar maiúsculas/minúsculas
   - Testar após cada configuração

---

## 🎓 APRENDIZADOS PRINCIPAIS

### Arquitetura
- Monolith: Frontend + Backend mesmo host
- Dev: Backend 5000, Frontend 5173 (separados)
- Prod: Frontend embutido em Express

### OAuth
- PKCE S256 implementado
- State/Nonce validation implementado
- HttpOnly cookies implementado

### Base URL Detection
- Automático via headers (não hardcoded)
- Cloud Run injeta X-Forwarded-Proto

### Webhook
- Idempotency via eventKey
- Token validation simples mas efetivo

---

## 🚀 PRÓXIMO PASSO

```
1. Escolha seu caminho de leitura acima
2. Comece pelo SUMARIO_EXECUTIVO.md (5 min)
3. Depois escolha:
   - PROXIMAS_ACOES.md se quer implementar agora
   - VALIDACAO_EXATA.md se quer estudar mais
   - REFERENCIA_RAPIDA.md se quer ir rápido
4. Siga os PASSOS (1-5)
5. Execute os TESTES (1-6)
6. Valide com CHECKLIST final
7. Go-live! 🎉
```

---

## 💬 FAQ

**P: Quanto tempo leva?**  
R: 60-65 minutos de implementação (+ leitura conforme seu tempo)

**P: Preciso de conhecimento prévio?**  
R: Sim, você precisa saber:
- PowerShell ou bash (para gcloud)
- Como fazer login no Google Console
- Como fazer login no Asaas
- O que é uma variável de ambiente

**P: E se tiver erro?**  
R: Consulte seções TROUBLESHOOTING nos documentos

**P: Todos os testes precisam passar?**  
R: Sim, os 6 testes validam cada componente

**P: Pode fazer em etapas?**  
R: Sim, faça um PASSO por dia se preferir

**P: Precisa de ajuda externa?**  
R: Tudo está documentado. Se precisar, consulte código do projeto (verificação)

---

**Última atualização:** 1º de fevereiro de 2026  
**Status:** ✅ Documentação Completa  
**Próximo:** COMECE EM PROXIMAS_ACOES_PASSO_A_PASSO.md

**Boa sorte! 🚀**
