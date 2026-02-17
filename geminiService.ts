import { GoogleGenAI } from "@google/genai";
import { UserProfile, Subject } from "./types";

export interface FileAttachment {
  data: string; // Base64
  mimeType: string;
  name: string;
}

export const getGeminiStreamResponse = async (
  prompt: string,
  profile: UserProfile,
  activeSubject: Subject | null,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  attachment?: FileAttachment | null
) => {
  // Inicialización del cliente usando la variable de entorno gestionada por Vite (VITE_API_KEY)
  // Nota: En Vercel, debes agregar la variable de entorno como VITE_API_KEY
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    console.error("Falta VITE_API_KEY. Verifica tu archivo .env o la configuración de Vercel.");
    // Fallback temporal para evitar crash inmediato si está mal configurado, pero no funcionará
  }

  const ai = new GoogleGenAI({ apiKey: apiKey || "" });

  const focusSubject = activeSubject || profile.selectedSubject;

  const systemInstruction = `
    Eres "FACEA-AI", el Mentor Digital de ÉLITE de la Facultad de Ciencias Económicas y Administrativas (FACEA) de la Universidad de Nariño.
    
    PERFIL DEL ESTUDIANTE:
    - Nombre: ${profile.name}
    - Programa: ${profile.program}
    - Semestre: ${profile.semester}
    - MATERIA ACTUAL: ${focusSubject.name} (Categoría: ${focusSubject.category})
    
    TU IDENTIDAD Y MISIÓN:
    Eres el **EXPERTO MÁXIMO en ${focusSubject.name}**. No eres un asistente genérico. Tu dominio sobre esta materia es absoluto.
    Tu misión es guiar al estudiante "${profile.name}" del programa de ${profile.program} para que domine ${focusSubject.name} con profundidad y pensamiento crítico.

    ESTILO DE RESPUESTA:
    1. RIGOR ACADÉMICO: Usa lenguaje técnico propio de la economía y administración.
    2. CONTEXTUALIZACIÓN: Siempre que sea posible, menciona la relevancia del tema en el contexto de Nariño, Colombia o el panorama global.
    3. PENSAMIENTO CRÍTICO: No des solo la respuesta; explica el "por qué" y el "cómo", planteando escenarios de análisis.
    4. FORMATO: Utiliza Markdown para que las respuestas sean visualmente impecables (negritas, listas, tablas).
  `;

  const userParts: any[] = [{ text: prompt }];

  if (attachment) {
    userParts.push({
      inlineData: {
        data: attachment.data,
        mimeType: attachment.mimeType
      }
    });
  }

  // Uso de Gemini 1.5 Pro (versión estable)
  return ai.models.generateContentStream({
    model: "gemini-1.5-pro",
    contents: [
      ...history,
      { role: 'user', parts: userParts }
    ],
    config: {
      systemInstruction,
      temperature: 0.7,
      topP: 0.95,
    }
  });
};