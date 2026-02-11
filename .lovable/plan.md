

## Alterar layout das reuniões para 4 por linha

**Alteração simples:** Na linha 281 do ficheiro `src/pages/Reunioes.tsx`, mudar a classe CSS do grid de `grid-cols-1 lg:grid-cols-2` para `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`.

Isto fará com que:
- Em ecrãs pequenos (mobile): 1 reunião por linha
- Em ecrãs médios (tablets): 2 reuniões por linha
- Em ecrãs grandes (desktop): 4 reuniões por linha

### Detalhe técnico
Ficheiro: `src/pages/Reunioes.tsx`, linha 281
- De: `grid grid-cols-1 lg:grid-cols-2 gap-4`
- Para: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`

