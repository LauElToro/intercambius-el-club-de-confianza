import type { QueryClient } from "@tanstack/react-query";
import type { NavigateFunction } from "react-router-dom";
import { chatService } from "@/services/chat.service";

/**
 * Precarga el hilo del chat y luego navega, para evitar la pantalla
 * "No se encontró la conversación" por carrera justo después de crear la conversación.
 */
export async function prefetchChatDetalleYNavigate(
  queryClient: QueryClient,
  navigate: NavigateFunction,
  conversacionId: number,
): Promise<void> {
  const idStr = String(conversacionId);
  try {
    await queryClient.prefetchQuery({
      queryKey: ["chat", idStr],
      queryFn: () => chatService.getMensajes(conversacionId),
    });
  } catch {
    // Chat.tsx reintentará al entrar
  }
  await queryClient.invalidateQueries({ queryKey: ["chat"] });
  navigate(`/chat/${conversacionId}`);
}
