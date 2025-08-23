// Global type declarations

// For MSW
interface Window {
  __msw_worker?: any;
}

declare module 'msw' {
  export const http: any;
  export const HttpResponse: any;
}

declare module 'msw/browser' {
  export function setupWorker(...args: any[]): any;
}

// For recharts
declare module 'recharts' {
  export * from '@types/recharts';
}
