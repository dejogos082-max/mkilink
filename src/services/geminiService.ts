import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getPerformanceRate(): Promise<number> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a performance rate between 0 and 100 as a number. Return only the number.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.NUMBER,
        },
      },
    });

    const text = response.text;
    if (!text) return 0;
    
    const rate = parseFloat(text.trim());
    return isNaN(rate) ? 0 : Math.max(0, Math.min(100, rate));
  } catch (error) {
    console.error("Error getting performance rate from Gemini:", error);
    return 0;
  }
}

const MKI_MANUAL = `
Manual MKI Links PRO:
- Login: Use email e senha ou Google. Se esquecer a senha, use a recuperação de senha.
- Links: Crie links curtos colando a URL original. Você pode personalizar o final do link.
- Redirect: Links curtos redirecionam para a URL original após passarem pela página de intersticial (se monetizado).
- Erros: Se o link não abrir, verifique a URL original. Se a página não carregar, limpe o cache.
- Estatísticas: Cliques são rastreados por país, dispositivo e navegador. Atualização em até 5 min.
- Pagamento/Monetização: Ganhe por visualizações. Saque mínimo R$ 50,00 via PIX ou PayPal. Requisitos: conta ativa e tráfego real.
- Segurança/Denúncia: Reporte links maliciosos via suporte. Phishing e malware são proibidos.
- Conta/Config: Altere seu email ou senha nas configurações de perfil. Verificação de conta via email.
`;

export async function getChatResponse(message: string, history: any[]): Promise<string> {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history,
      config: {
        systemInstruction: `Você é a MKI AI, assistente de suporte do MKI Links PRO.
        
        REGRAS:
        1) Classifique a intenção em: LOGIN, LINKS, REDIRECT, ERROS, ESTATÍSTICAS, PAGAMENTO/MONETIZAÇÃO, SEGURANÇA/DENÚNCIA, CONTA/CONFIG, OUTROS.
        2) Responda com passos numerados se houver solução.
        3) Peça o mínimo de dados se necessário.
        4) Se não conseguir resolver o problema ou o usuário ainda precisar de ajuda, peça o Endereço de e-mail e peça para descrever o problema detalhadamente.
        5) NUNCA use o caractere "*" (asterisco) em suas respostas. Use outros formatos para listas ou destaque se necessário.
        6) Se o usuário fornecer o e-mail e a descrição detalhada do problema, inclua no final da sua resposta o seguinte JSON: {"trigger_support_request": true, "user_email": "EMAIL_FORNECIDO", "problem_description": "DESCRICAO_FORNECIDA"}. Substitua EMAIL_FORNECIDO e DESCRICAO_FORNECIDA pelos dados reais.
        
        CONTEXTO (MANUAL):
        ${MKI_MANUAL}
        
        Responda em PT-BR.`,
      },
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Desculpe, não consegui processar sua solicitação no momento.";
  } catch (error) {
    console.error("Error getting chat response from Gemini:", error);
    return "Desculpe, estou com dificuldades técnicas. Tente novamente mais tarde.";
  }
}
