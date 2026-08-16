export interface HelloMessage {
  type: "hello";
}

export function helloLine(): string {
  const message: HelloMessage = { type: "hello" };
  return JSON.stringify(message);
}
