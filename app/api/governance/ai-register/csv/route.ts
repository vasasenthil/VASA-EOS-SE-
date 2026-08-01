import { NextResponse } from "next/server"
import { aiRegisterToCSV } from "@/lib/ai/register"

export async function GET() {
  return new NextResponse(aiRegisterToCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-ai-register.csv"',
    },
  })
}
