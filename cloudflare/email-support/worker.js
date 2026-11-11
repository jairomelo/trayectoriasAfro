import { EmailMessage } from "cloudflare:email";

const DOMAIN = "trayectoriasafro.org";
const SUBJECT_MARKER = "[TA support]";

const ROUTED = new Map([
  [`support@${DOMAIN}`, "en"],
  [`soporte@${DOMAIN}`, "es"],
]);

export default {
  async email(message, env, ctx) {
    const to = message.to.toLowerCase();
    const lang = ROUTED.get(to);

    if (!lang) {
      await message.forward(env.FORWARD_TO);
      return;
    }

    const subject = message.headers.get("subject") || "";

    const forwardHeaders = new Headers();
    forwardHeaders.set("X-TA-Route", to.split("@")[0]);
    forwardHeaders.set("X-TA-Original-To", message.to);

    await message.forward(env.FORWARD_TO, forwardHeaders);

    if (!shouldAutoReply(message, subject, env.FORWARD_TO)) return;

    try {
      const raw = buildAutoReply(message, lang, subject);
      await message.reply(new EmailMessage(message.to, message.from, raw));
    } catch (error) {
      console.error("Auto-reply failed", {
        from: message.from,
        to: message.to,
        error: String(error),
      });
    }
  },
};

function shouldAutoReply(message, subject, forwardTo) {
  const from = (message.from || "").toLowerCase();
  if (!from.includes("@")) return false;
  if (from.endsWith(`@${DOMAIN}`) || from === forwardTo.toLowerCase()) return false;
  if (subject.includes(SUBJECT_MARKER)) return false;

  const autoSubmitted = (message.headers.get("auto-submitted") || "").toLowerCase();
  if (autoSubmitted && autoSubmitted !== "no") return false;
  if (message.headers.get("x-auto-response-suppress")) return false;
  if (message.headers.get("list-id")) return false;

  const precedence = (message.headers.get("precedence") || "").toLowerCase();
  if (["bulk", "list", "junk"].includes(precedence)) return false;

  const local = from.split("@")[0];
  if (/(^|[._-])(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounce)/.test(local)) {
    return false;
  }

  return true;
}

function buildAutoReply(message, lang, originalSubject) {
  const from = cleanHeader(message.to);
  const to = cleanHeader(message.from);
  const originalMessageId = cleanHeader(message.headers.get("Message-ID") || "");
  const baseSubject = cleanHeader(originalSubject) || (lang === "es" ? "(sin asunto)" : "(no subject)");
  const subject = /^re:/i.test(baseSubject)
    ? `${SUBJECT_MARKER} ${baseSubject}`
    : `${SUBJECT_MARKER} Re: ${baseSubject}`;

  const body = lang === "es" ? BODY_ES : BODY_EN;
  const boundary = `ta_${crypto.randomUUID()}`;

  const headers = [
    `From: TrayectoriasAfro <${from}>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${DOMAIN}>`,
    "Auto-Submitted: auto-replied",
    "X-TA-Autoreply: 1",
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  if (originalMessageId) {
    headers.push(`In-Reply-To: ${originalMessageId}`);
    headers.push(`References: ${originalMessageId}`);
  }

  return [
    ...headers,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(toBase64(body.text)),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(toBase64(body.html)),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

const BODY_ES = {
  text: [
    "Hola:",
    "",
    "Gracias por escribir a TrayectoriasAfro. Hemos recibido tu mensaje y alguien de nuestro equipo se pondrá en contacto contigo pronto.",
    "",
    "Este es un acuse de recibo automático. Si necesitas añadir información, puedes responder a este correo.",
    "",
    "Equipo TrayectoriasAfro",
    "https://trayectoriasafro.org",
  ].join("\n"),
  html: [
    "<p>Hola:</p>",
    "<p>Gracias por escribir a TrayectoriasAfro. Hemos recibido tu mensaje y alguien de nuestro equipo se pondrá en contacto contigo pronto.</p>",
    "<p>Este es un acuse de recibo automático. Si necesitas añadir información, puedes responder a este correo.</p>",
    "<p>Equipo TrayectoriasAfro<br><a href=\"https://trayectoriasafro.org\">trayectoriasafro.org</a></p>",
  ].join("\n"),
};

const BODY_EN = {
  text: [
    "Hello,",
    "",
    "Thank you for writing to TrayectoriasAfro. We have received your message and someone from our team will be in touch with you soon.",
    "",
    "This is an automated acknowledgement. If you need to add information, you can reply to this email.",
    "",
    "The TrayectoriasAfro Team",
    "https://trayectoriasafro.org",
  ].join("\n"),
  html: [
    "<p>Hello,</p>",
    "<p>Thank you for writing to TrayectoriasAfro. We have received your message and someone from our team will be in touch with you soon.</p>",
    "<p>This is an automated acknowledgement. If you need to add information, you can reply to this email.</p>",
    "<p>The TrayectoriasAfro Team<br><a href=\"https://trayectoriasafro.org\">trayectoriasafro.org</a></p>",
  ].join("\n"),
};

function cleanHeader(value) {
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

function encodeHeader(value) {
  if (/^[\x20-\x7E]*$/.test(value)) return value;

  const encoder = new TextEncoder();
  const words = [];
  let chunk = "";
  let size = 0;

  for (const char of value) {
    const charSize = encoder.encode(char).length;
    if (size + charSize > 45) {
      words.push(`=?UTF-8?B?${toBase64(chunk)}?=`);
      chunk = "";
      size = 0;
    }
    chunk += char;
    size += charSize;
  }

  if (chunk) words.push(`=?UTF-8?B?${toBase64(chunk)}?=`);
  return words.join("\r\n ");
}

function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function wrapBase64(value) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}
