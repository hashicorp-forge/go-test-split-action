export function debug(_message: string): void {}

export function info(_message: string): void {}

export function warning(_message: string | Error): void {}

export function getInput(_name: string): string {
  return "";
}

export function setOutput(_name: string, _value: unknown): void {}

export async function group<T>(
  _name: string,
  fn: () => Promise<T>,
): Promise<T> {
  return fn();
}

export function setFailed(_message: string | Error): void {}
