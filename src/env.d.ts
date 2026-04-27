/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.astro' {
  import type { AstroComponentFactory } from 'astro/dist/runtime/server';
  const component: AstroComponentFactory;
  export default component;
}

declare namespace App {
  interface Locals {
    userRole: string;
  }
}
