/** Must match backend normalization in assistance.facade setFreeDayFromAssistance */
export enum FreeDayConfirmationPhrase {
  CONFIRM = "confirmo eliminacion",
}

export function isFreeDayConfirmationValid(phrase: string): boolean {
  return phrase.trim().toLowerCase() === FreeDayConfirmationPhrase.CONFIRM;
}

export function getAxiosErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const r = error as { response?: { data?: { message?: string } } };
    if (typeof r.response?.data?.message === "string") {
      return r.response.data.message;
    }
  }
  return "Ocurrió un error";
}
