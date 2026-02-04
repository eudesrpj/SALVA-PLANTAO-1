# Checkpoint de Limpeza da Arquitetura

Data: 4 de fevereiro de 2026

## Estado Atual Antes da Limpeza
- Produção funcionando em: https://appsalvaplantao.com.br
- Última revisão: salva-plantao-prod-00089-brl
- Sistema de autenticação: OAuth Google + JWT
- Sistema de billing: Asaas integrado
- WebSockets funcionais
- IA Chat implementado

## Objetivo
Reorganizar e remover código duplicado/não utilizado sem quebrar funcionalidades de produção.

## Regras Não-Negociáveis
1. Não inventar código novo
2. Não alterar comportamento a menos que necessário para remoção de duplicatas
3. Toda deleção deve ser justificada com evidência
4. Relatório completo obrigatório
5. Testes finais: npm run check + npm run build devem passar