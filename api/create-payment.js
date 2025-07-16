// /api/create-payment.js для pay.tech (с исправлением CORS)

export default async function handler(request, response) {
  // --- НАЧАЛО: Логика для обработки CORS ---
  // Разрешаем запросы с любого домена. Для продакшена лучше указать конкретный домен вашего сайта.
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Браузер отправляет предварительный OPTIONS-запрос для проверки CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  // --- КОНЕЦ: Логика для обработки CORS ---

  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const paymentDataFromFrontend = request.body;
    const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY;

    if (!PAYTECH_API_KEY) {
      throw new Error('API ключ pay.tech не настроен на сервере.');
    }
    
    const bodyForApi = {
        ...paymentDataFromFrontend,
        referenceId: `order_${Date.now()}`,
    };

    const PAYTECH_SANDBOX_URL = 'https://engine-sandbox.pay.tech/api/v1/payments';

    const paytechResponse = await fetch(PAYTECH_SANDBOX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYTECH_API_KEY}`
      },
      body: JSON.stringify(bodyForApi),
    });

    const paytechData = await paytechResponse.json();
    if (!paytechResponse.ok) throw new Error(paytechData.message || 'Ошибка от платежной системы pay.tech');
    
    const redirectUrl = paytechData.result.redirectUrl;
    if (!redirectUrl) throw new Error('Не удалось получить redirectUrl от pay.tech');

    // Отправляем ссылку обратно на фронтенд
    return response.status(200).json({ redirectUrl: redirectUrl });

  } catch (error) {
    console.error('[PAYTECH_SANDBOX_ERROR]', error.message);
    return response.status(500).json({ message: error.message });
  }
}