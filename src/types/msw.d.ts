// Type definitions for MSW (Mock Service Worker) v1.x

interface Window {
  __msw_worker?: any;
}

declare module 'msw' {
  export interface MockedResponse extends ResponseInit {
    body?: BodyInit | null;
  }

  export interface ResponseComposition<T = any> {
    (body?: T, init?: ResponseInit): MockedResponse;
  }

  export interface ResponseTransformer<T = any> {
    (body?: T, init?: ResponseInit): MockedResponse;
  }

  export interface RestContext {
    status: (statusCode: number, statusText?: string) => ResponseTransformer;
    set: (headers: Record<string, string>) => ResponseTransformer;
    delay: (durationMs: number) => ResponseTransformer;
    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    json: <T>(body: T) => MockedResponse;
    text: (body: string) => MockedResponse;
    xml: (body: string) => MockedResponse;
    passthrough: () => MockedResponse;
  }

  export interface RestRequest<Params = any, RequestBody = any> extends Request {
    params: Params;
    body: RequestBody;
    json(): Promise<RequestBody>;
  }

  export interface RestHandler {
    (req: RestRequest, res: ResponseComposition, ctx: RestContext): Promise<MockedResponse | undefined> | MockedResponse | undefined;
  }

  export const http: {
    get: (path: string, handler: RestHandler) => RestHandler;
    post: (path: string, handler: RestHandler) => RestHandler;
    put: (path: string, handler: RestHandler) => RestHandler;
    delete: (path: string, handler: RestHandler) => RestHandler;
    patch: (path: string, handler: RestHandler) => RestHandler;
    options: (path: string, handler: RestHandler) => RestHandler;
    head: (path: string, handler: RestHandler) => RestHandler;
    all: (path: string, handler: RestHandler) => RestHandler;
  };

  export function setupWorker(...handlers: RestHandler[]): {
    start: (options?: any) => Promise<void>;
    stop: () => Promise<void>;
  };
}

declare module 'msw/node' {
  export function setupServer(...handlers: any[]): {
    listen: (options?: any) => void;
    close: () => void;
    resetHandlers: () => void;
    use: (...handlers: any[]) => void;
  };
}
