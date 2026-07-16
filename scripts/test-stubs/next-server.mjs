export class NextResponse extends Response {
  static json(body, init = {}) {
    return new NextResponse(JSON.stringify(body), { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } })
  }
}
export class NextRequest extends Request {
  constructor(input, init) { super(input, init); this.nextUrl = new URL(typeof input === 'string' ? input : input.url) }
}
