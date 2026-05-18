export interface AIResponse {
  text: string;
  model: string;
}

const MODELS = [
  "qwen/qwen2.5-vl-72b-instruct",
  "google/gemini-2.0-flash-exp",
  "meta-llama/llama-3.2-90b-vision-instruct"
];

export const geminiService = {
  async analyzeGeneratorPanel(
    base64Image: string,
    prompt: string
  ): Promise<AIResponse> {

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("VITE_OPENROUTER_API_KEY no configurada");
    }

    const cleanBase64 = base64Image.includes(",")
      ? base64Image.split(",")[1]
      : base64Image;

    let lastError: any = null;

    for (const modelName of MODELS) {

      try {

        console.log(`[OpenRouter] Procesando con modelo: ${modelName}`);

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": window.location.origin,
              "X-Title": "Dashboard Generadores"
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: prompt
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/png;base64,${cleanBase64}`
                      }
                    }
                  ]
                }
              ],
              temperature: 0.2,
              max_tokens: 1200
            })
          }
        );

        if (!response.ok) {

          const errorText = await response.text();

          console.error(
            `[OpenRouter] Error HTTP ${response.status}:`,
            errorText
          );

          lastError = errorText;

          continue;
        }

        const data = await response.json();

        console.log("[OpenRouter] Respuesta:", data);

        const text =
          data?.choices?.[0]?.message?.content || "";

        if (!text) {
          throw new Error("Respuesta vacía");
        }

        return {
          text,
          model: modelName
        };

      } catch (error) {

        console.error(
          `[OpenRouter] Error con ${modelName}:`,
          error
        );

        lastError = error;
      }
    }

    throw lastError || new Error("No se pudo analizar la imagen");
  }
};
