import { NextResponse } from "next/server";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/send — send a test email using the React email template.
 * Body (optional): { to?: string, firstName?: string }
 * Requires RESEND_API_KEY in env. For production, use a verified domain in `from`.
 * See https://resend.com/docs/send-with-nextjs
 */
export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set" },
      { status: 500 }
    );
  }

  let to: string[] = ["delivered@resend.dev"];
  let firstName = "John";

  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body === "object") {
      if (typeof body.to === "string" && body.to) to = [body.to];
      if (typeof body.firstName === "string" && body.firstName) firstName = body.firstName;
    }
  } catch {
    // keep defaults
  }

  const { data, error } = await resend.emails.send({
    from: "FilmDB <onboarding@resend.dev>",
    to,
    subject: "Hello from FilmDB",
    react: EmailTemplate({ firstName }),
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}
