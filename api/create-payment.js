// /api/create-payment.js для pay.tech (тестовая среда)

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const paymentDataFromFrontend = request.body;
    const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY;

    if (!PAYTECH_API_KEY) {
      throw new Error("API ключ pay.tech не настроен на сервере.");
    }

    // Формируем тело запроса, добавляя уникальный ID транзакции
    const bodyForApi = {
      ...paymentDataFromFrontend,
      referenceId: `order_${Date.now()}`,
    };

    // --- Используем URL для песочницы из документации ---
    const PAYTECH_SANDBOX_URL =
      "https://engine-sandbox.pay.tech/api/v1/payments";
    // ---------------------------------------------------

    const paytechResponse = await fetch(PAYTECH_SANDBOX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYTECH_API_KEY}`, // Аутентификация с вашим ключом
      },
      body: JSON.stringify(bodyForApi),
    });

    const paytechData = await paytechResponse.json();

    // Проверяем, что ответ от pay.tech успешный
    if (!paytechResponse.ok) {
      // Если есть сообщение об ошибке от API, используем его
      throw new Error(
        paytechData.message || "Ошибка от платежной системы pay.tech"
      );
    }

    // Извлекаем ссылку для перенаправления из ответа
    const redirectUrl = paytechData.result.redirectUrl;

    if (!redirectUrl) {
      throw new Error("Не удалось получить redirectUrl от pay.tech");
    }

    // Отправляем ссылку обратно на фронтенд
    return response.status(200).json({ redirectUrl: redirectUrl });
  } catch (error) {
    console.error("[PAYTECH_SANDBOX_ERROR]", error.message);
    return response.status(500).json({ message: error.message });
  }
}
