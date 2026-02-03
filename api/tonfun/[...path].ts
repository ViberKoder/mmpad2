// Vercel Serverless Function для проксирования запросов к api.ton.fun
// Это обходит проблему CORS

export default async function handler(req: any, res: any) {
  // Обработка OPTIONS запроса для CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Получаем путь из параметров
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';
  
  // Получаем query параметры из URL
  const queryString = req.url?.includes('?') 
    ? req.url.substring(req.url.indexOf('?')) 
    : '';
  
  // Формируем URL для api.ton.fun
  const url = `https://api.ton.fun/${pathString}${queryString}`;
  
  console.log(`[Proxy] ${req.method} ${url}`);
  
  try {
    // Копируем заголовки запроса (кроме host и connection)
    const headers: Record<string, string> = {};
    if (req.headers) {
      Object.keys(req.headers).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'host' && lowerKey !== 'connection' && lowerKey !== 'content-length') {
          const value = req.headers[key];
          if (typeof value === 'string') {
            headers[key] = value;
          } else if (Array.isArray(value) && value.length > 0) {
            headers[key] = value[0];
          }
        }
      });
    }
    
    // Выполняем запрос к api.ton.fun
    const response = await fetch(url, {
      method: req.method || 'GET',
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body 
        ? JSON.stringify(req.body) 
        : undefined,
    });
    
    // Получаем данные
    let data: string;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await response.json();
      data = JSON.stringify(data);
    } else {
      data = await response.text();
    }
    
    // Копируем заголовки ответа (кроме CORS заголовков)
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'access-control-allow-origin' && 
          lowerKey !== 'access-control-allow-methods' &&
          lowerKey !== 'access-control-allow-headers') {
        res.setHeader(key, value);
      }
    });
    
    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Expose-Headers', '*');
    
    // Отправляем ответ
    res.status(response.status).send(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: error.message });
  }
}
