export type EventAccessErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "CAPABILITY_DENIED";

export class EventAccessError extends Error {
  readonly code: EventAccessErrorCode;

  constructor(code: EventAccessErrorCode, message: string) {
    super(message);
    this.name = "EventAccessError";
    this.code = code;
  }
}

export function isEventAccessError(error: unknown): error is EventAccessError {
  return error instanceof EventAccessError;
}
