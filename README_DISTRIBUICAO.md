# Invy Distribuicao

Edicao cliente do Invy para Windows. O pacote inclui somente a aplicacao; bancos,
uploads, credenciais, chaves privadas e configuracoes reais nao fazem parte da
distribuicao.

## Configuracao inicial

1. Copie `.env.example` para `.env` ao lado de `Invy.exe`.
2. Defina `SECRET_KEY`, `ADMIN_PASSWORD` e `MASTER_ADMIN_CODE` com valores fortes.
3. Mantenha todas as integracoes desligadas se nao forem usadas.
4. Inicie `Invy.exe`; o SQLite sera criado localmente.

## Integracoes opcionais

Dell, Microsoft Graph e DocuSign sao opcionais. Os campos no `.env.example`
funcionam apenas como modelo e ficam vazios. O cliente deve obter suas proprias
credenciais junto a cada fornecedor e grava-las somente no `.env` local.

Nunca envie `.env`, bancos, certificados, chaves privadas ou arquivos de clientes
ao GitHub. O `.gitignore` deste projeto ja bloqueia esses itens.

## Gerar o pacote

Execute `build_invy_exe.bat`. O resultado para entrega fica em `releases/` e
contem apenas a edicao cliente. O executavel empacota o codigo Python, mas isso nao
substitui a protecao de segredos: nenhuma credencial deve ser embutida nele.
