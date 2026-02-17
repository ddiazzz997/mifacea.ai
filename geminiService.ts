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
  // Inicialización del cliente usando la variable de entorno gestionada por Vite/IDX
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const focusSubject = activeSubject || profile.selectedSubject;

  const systemInstruction = `
    Eres "FACEA-AI", el Mentor Digital de ÉLITE de la Facultad de Ciencias Económicas y Administrativas (FACEA) de la Universidad de Nariño.
    
    PERFIL DEL ESTUDIANTE:
    - Nombre: ${profile.name}
    - Programa: ${profile.program}
    - Semestre: ${profile.semester}
    - MATERIA ACTUAL: ${focusSubject.name} (Categoría: ${focusSubject.category})

    TU IDENTIDAD Y MISIÓN:
    No eres un asistente genérico. Eres un experto en ciencias económicas y administrativas con un enfoque pedagógico de alto nivel. Tu misión es desafiar el intelecto de los estudiantes de la Udenar.

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