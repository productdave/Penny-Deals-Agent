export interface PriceAlertPayload {
  productName: string;
  oldPrice: number;
  newPrice: number;
  targetPrice: number;
  hitTarget: boolean;
  image?: string;
  url?: string;
  toEmail: string;
}

export async function sendPriceAlert(payload: PriceAlertPayload) {
  const { productName, oldPrice, newPrice, targetPrice, hitTarget, image, url, toEmail } = payload;

  const apiKey = process.env.MAILGUN_API_KEY ?? '';
  const domain = process.env.MAILGUN_DOMAIN ?? '';
  const apiUrl = process.env.MAILGUN_API_URL ?? 'https://api.mailgun.net';
  const from = process.env.MAILGUN_FROM ?? `Penny Intelligence <penny@${domain}>`;

  if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN must be set in .env');

  const drop = oldPrice - newPrice;
  const dropPct = oldPrice > 0 ? ((drop / oldPrice) * 100).toFixed(1) : '0';
  const subject = hitTarget
    ? `🎯 Penny: ${productName} hit your target — $${newPrice.toFixed(2)}`
    : `📉 Penny: ${productName} dropped to $${newPrice.toFixed(2)}`;

  const imageHtml = image
    ? `<img src="${image}" alt="${productName}" style="width:100%;max-width:400px;height:200px;object-fit:cover;display:block;margin:0 auto 24px;" />`
    : '';

  const ctaHtml = url
    ? `<a href="${url}" style="display:inline-block;background:#e9c349;color:#131313;font-weight:900;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 32px;text-decoration:none;margin-top:24px;">View Product →</a>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#131313;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#f0ead6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <tr><td>
      <p style="color:#e9c349;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">Penny Intelligence</p>
      <h1 style="font-size:28px;font-weight:900;color:#f0ead6;margin:0 0 32px;line-height:1.2;">
        ${hitTarget ? '🎯 Target Reached' : '📉 Price Drop Detected'}
      </h1>
      ${imageHtml}
      <h2 style="font-size:22px;font-weight:900;color:#f0ead6;margin:0 0 24px;border-left:4px solid #e9c349;padding-left:16px;">
        ${productName}
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;padding:24px;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;">
            <span style="color:#9e9e9e;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">Previous Price</span><br/>
            <span style="font-size:24px;font-weight:900;color:#9e9e9e;text-decoration:line-through;">$${oldPrice.toFixed(2)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <span style="color:#9e9e9e;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">New Price</span><br/>
            <span style="font-size:36px;font-weight:900;color:#e9c349;">$${newPrice.toFixed(2)}</span>
            <span style="font-size:14px;color:#4caf50;margin-left:8px;font-weight:700;">↓ ${dropPct}%</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid #333;">
            <span style="color:#9e9e9e;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">Your Target</span><br/>
            <span style="font-size:20px;font-weight:700;color:${hitTarget ? '#4caf50' : '#9e9e9e'};">$${targetPrice.toFixed(2)} ${hitTarget ? '✓ Reached' : ''}</span>
          </td>
        </tr>
      </table>
      ${hitTarget
        ? `<p style="color:#4caf50;font-size:15px;font-weight:700;margin:0 0 16px;">Your target price has been reached. This is an optimal acquisition window.</p>`
        : `<p style="color:#9e9e9e;font-size:14px;margin:0 0 16px;">Price is now $${(newPrice - targetPrice).toFixed(2)} above your target of $${targetPrice.toFixed(2)}.</p>`
      }
      ${ctaHtml}
      <p style="color:#555;font-size:11px;margin-top:48px;border-top:1px solid #333;padding-top:16px;letter-spacing:0.1em;">
        PENNY INTELLIGENCE · AI-POWERED SHOPPING CONCIERGE<br/>
        You're receiving this because you're tracking ${productName}.
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  const body = new URLSearchParams({ from, to: toEmail, subject, html });
  const res = await fetch(`${apiUrl}/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mailgun error ${res.status}: ${text}`);
  }

  console.log(`[mailer] Alert sent to ${toEmail} for ${productName}`);
}
