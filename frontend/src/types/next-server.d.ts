declare module 'next/server' {
  export class NextRequest extends Request {
    json(): Promise<any>;
    formData(): Promise<FormData>;
    headers: Headers;
    nextUrl: URL;
    ip?: string;
  }
  
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, init?: ResponseInit): NextResponse;
  }
}
