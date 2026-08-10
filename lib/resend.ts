import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? "SubSplit <onboarding@resend.dev>";

/**
 * Отправка письма через Resend. Если ключ не настроен — молча пропускает
 * (приглашение всё равно создаётся, пользователь увидит ссылку в UI).
 */
export async function sendInviteEmail({
  to,
  groupName,
  subscriptionName,
  sharePercent,
  inviteLink,
}: {
  to: string;
  groupName: string;
  subscriptionName: string;
  sharePercent: number;
  inviteLink: string;
}): Promise<{ sent: boolean }> {
  if (!RESEND_API_KEY) {
    console.warn(
      "[resend] RESEND_API_KEY is not set — invite email to",
      to,
      "was not sent"
    );
    return { sent: false };
  }

  const resend = new Resend(RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [to],
    subject: `Вас пригласили в группу «${groupName}» на SubSplit`,
    html: inviteEmailHtml({
      groupName,
      subscriptionName,
      sharePercent,
      inviteLink,
    }),
    text: `Вас пригласили в группу ${groupName} для ${subscriptionName}. Присоединяйтесь: ${inviteLink}`,
  });

  if (error) {
    console.error("[resend] failed to send invite email:", error);
    return { sent: false };
  }
  return { sent: true };
}

function inviteEmailHtml({
  groupName,
  subscriptionName,
  sharePercent,
  inviteLink,
}: {
  groupName: string;
  subscriptionName: string;
  sharePercent: number;
  inviteLink: string;
}): string {
  const rounded = Math.round(sharePercent * 100) / 100;
  return `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0;font-size:14px;color:#71717a;">SubSplit</p>
                <h1 style="margin:8px 0 0;font-size:22px;color:#18181b;line-height:1.3;">
                  Вас пригласили в группу<br/>«${groupName}»
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                  <tr>
                    <td style="padding:16px;font-size:14px;color:#3f3f46;line-height:1.6;">
                      Ваш друг делит с вами подписку<br/>
                      <strong style="color:#18181b;">${subscriptionName}</strong><br/><br/>
                      Ваша доля: <strong style="color:#18181b;">${rounded}%</strong> — вы платите только свою часть.
                    </td>
                  </tr>
                </table>
                <div style="text-align:center;margin-top:24px;">
                  <a href="${inviteLink}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;">
                    Присоединиться к группе
                  </a>
                </div>
                <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;text-align:center;word-break:break-all;">
                  Если кнопка не работает, откройте ссылку:<br/>
                  <a href="${inviteLink}" style="color:#71717a;">${inviteLink}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
