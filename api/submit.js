// api/submit.js

async function sendTelegramDirect({ name, phone, message }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.');
    return;
  }

  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const text =
    `[강릉 우미린 문의 접수]\n` +
    `- 이름: ${name}\n` +
    `- 연락처: ${phone}\n` +
    `- 문의사항: ${message || '없음'}\n` +
    `- 접수시간: ${timestamp}`;

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const chatIds = chatId.split(',').map((id) => id.trim()).filter(Boolean);

  await Promise.all(
    chatIds.map(async (id) => {
      try {
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: id, text }),
        });
        const result = await response.json();
        if (!result.ok) {
          console.error(`Telegram API Error for chatId ${id}:`, result);
        }
      } catch (err) {
        console.error(`Fetch error for chatId ${id}:`, err);
      }
    })
  );
}

async function sendToDashboard({ name, phone, message }) {
  const dashboardUrl = process.env.DASHBOARD_INTAKE_URL; // https://bunyang-dashboard.vercel.app/api/leads/intake
  const apiKey = process.env.DASHBOARD_API_KEY; // 강릉 우미 린 더 프리미어 현장 전용 API 키

  if (!dashboardUrl || !apiKey) {
    throw new Error('DASHBOARD_INTAKE_URL 또는 DASHBOARD_API_KEY 환경변수가 없습니다.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(dashboardUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        name,
        phone,
        message: message && message !== '없음' ? message : null,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Dashboard intake failed: ${response.status} ${body}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { name, phone, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: '이름과 연락처는 필수입니다.' });
    }

    try {
      await sendToDashboard({ name, phone, message });
    } catch (dashboardErr) {
      console.error('Dashboard intake error, falling back to direct Telegram send:', dashboardErr);
      await sendTelegramDirect({ name, phone, message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
}
