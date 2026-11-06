import type { IncomingMessage, ServerResponse } from "http";

export function checkout(req: IncomingMessage, res: ServerResponse): Promise<void>;
export function estado(req: IncomingMessage, res: ServerResponse): Promise<void>;
export function webhook(req: IncomingMessage, res: ServerResponse): Promise<void>;
