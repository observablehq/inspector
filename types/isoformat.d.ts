declare module "isoformat" {
  export function format(date: Date | number, fallback?: string): string;
  export function parse(string: string, fallback?: unknown): Date | undefined;
}
