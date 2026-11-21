declare module "htl" {
  export const html: ((template: readonly string[], ...values: unknown[]) => HTMLElement) & {
    fragment: (template: readonly string[], ...values: unknown[]) => DocumentFragment;
  };
  export const svg: ((template: readonly string[], ...values: unknown[]) => SVGElement) & {
    fragment: (template: readonly string[], ...values: unknown[]) => DocumentFragment;
  };
}
