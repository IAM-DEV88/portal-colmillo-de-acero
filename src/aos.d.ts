// Type definitions for AOS (Animate On Scroll)
declare module 'aos' {
  export interface AosOptions {
    offset?: number;
    delay?: number;
    duration?: number;
    easing?: string;
    once?: boolean;
    mirror?: boolean;
    anchorPlacement?: string;
  }

  export interface AosInstance {
    init(options?: AosOptions): void;
    refresh(): void;
    refreshHard(): void;
  }

  const AOS: AosInstance;
  export default AOS;
}

declare global {
  interface Window {
    AOS: import('aos').AosInstance;
  }
}
