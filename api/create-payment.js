// /api/create-payment.js (с улучшенным логированием)

export default async function handler(request, response) {
  // Настройка CORS
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (request.method === "OPTIONS") {
    return response.status(200).end();
  }

  if (request.method !== "POST") {
    return response.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const paymentDataFromFrontend = request.body;
    const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY;

    if (!PAYTECH_API_KEY) {
      throw new Error("API ключ pay.tech не настроен на сервере.");
    }

    const bodyForApi = {
      ...paymentDataFromFrontend,
      referenceId: `order_${Date.now()}`,
    };

    const PAYTECH_PRODUCTION_URL = "https://engine.pay.tech/api/v1/payments";

    const paytechResponse = await fetch(PAYTECH_PRODUCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYTECH_API_KEY}`,
      },
      body: JSON.stringify(bodyForApi),
    });

    const paytechData = await paytechResponse.json();

    // --- УЛУЧШЕНИЕ ЛОГИРОВАНИЯ ---
    if (!paytechResponse.ok) {
      // Логируем полный ответ от pay.tech, чтобы видеть реальную ошибку
      console.error(
        "Ошибка от API pay.tech:",
        JSON.stringify(paytechData, null, 2)
      );
      // Отправляем на фронтенд более детальную ошибку
      throw new Error(
        paytechData.message || "Ошибка от платежной системы pay.tech"
      );
    }

    const redirectUrl = paytechData.result.redirectUrl;
    if (!redirectUrl) {
      throw new Error("Не удалось получить redirectUrl от pay.tech");
    }

    return response.status(200).json({ redirectUrl: redirectUrl });
  } catch (error) {
    console.error("[BACKEND_ERROR]", error.message);
    return response.status(500).json({ message: error.message });
  }
}
