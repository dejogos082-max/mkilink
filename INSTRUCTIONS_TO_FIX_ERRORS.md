# Como Corrigir Erros de Autenticação

## 1. Erro de Login com Google (auth/unauthorized-domain)

Este erro ocorre porque o domínio atual da aplicação não está autorizado no seu projeto Firebase.

**Para corrigir:**

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Selecione o seu projeto (`mkienterprise`).
3.  No menu lateral esquerdo, vá em **Authentication**.
4.  Clique na aba **Settings** (Configurações).
5.  Role até a seção **Authorized domains** (Domínios autorizados).
6.  Clique em **Add domain** (Adicionar domínio).
7.  Adicione o seguinte domínio (copie exatamente como está):
    
    `ais-dev-w7ttkrngytdpknp5obgbv3-21427059060.us-west2.run.app`

8.  Clique em **Add**.

Após adicionar o domínio, aguarde alguns segundos e tente fazer login novamente.

## 2. Erro de hCaptcha (sitekey-secret-mismatch)

Este erro ocorria porque as chaves do hCaptcha configuradas não correspondiam ao domínio de preview dinâmico.

**Correção Aplicada:**

O sistema foi atualizado para usar as **Chaves de Teste Oficiais do hCaptcha** quando estiver rodando neste ambiente de preview. Isso permite que você teste o fluxo de registro e redirecionamento sem erros.

Quando você for para produção (seu domínio final), certifique-se de configurar as variáveis de ambiente `VITE_HCAPTCHA_SITEKEY` e `HCAPTCHA_SECRET` com suas chaves reais do hCaptcha.
