export function delay(ms: number = 3000): Promise<void> {
  const delayMs = process.env.WEBHOOK_DELAY ? Number(process.env.WEBHOOK_DELAY) : ms;
  return new Promise(resolve => setTimeout(resolve, delayMs));
}
