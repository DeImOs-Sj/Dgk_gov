export class ErrorWithCode<Code extends string = string> extends Error {
  constructor(
    message: string,
    public code: Code,
  ) {
    super(message);
  }
}

export const toError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  return new Error(`Unknown error: ${error}`);
};
