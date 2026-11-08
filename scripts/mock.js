/* Только для локальной проверки с ?mock=1. Код приложения не меняется. */
(() => {
  if (new URLSearchParams(location.search).get('mock') !== '1') return;

  const apiOrigin = 'https://v-content.practicum-team.ru';
  const mediaPrefix = `${apiOrigin}/__mock__/`;
  const mediaRoot = new URL('../images/mock/', document.currentScript.src);
  const originalFetch = window.fetch.bind(window);
  const originalSetAttribute = Element.prototype.setAttribute;

  // Прекод дописывает BASE_URL ко всем медиа. Перенаправляем только наши
  // тестовые адреса в локальную папку, не затрагивая остальные атрибуты.
  Element.prototype.setAttribute = function (name, value) {
    if (
      (this instanceof HTMLImageElement || this instanceof HTMLVideoElement) &&
      (name === 'src' || name === 'poster') &&
      String(value).startsWith(mediaPrefix)
    ) {
      value = new URL(String(value).slice(mediaPrefix.length), mediaRoot).href;
    }
    return originalSetAttribute.call(this, name, value);
  };

  const cities = [
    ['Белгород', 'ночной Белгород', 'night', 'belgorod'],
    ['Адлер', 'Адлер утром', 'morning', 'adler'],
    ['Воронеж', 'Вид из окна днём', 'afternoon', 'window'],
    ['Санкт-Петербург', 'Утро на тихой улице', 'morning', 'adler'],
    ['Москва', 'Вечерние огни города', 'night', 'belgorod'],
    ['Казань', 'Дневная прогулка', 'afternoon', 'window'],
    ['Пермь', 'Город просыпается', 'morning', 'adler'],
    ['Томск', 'Ночной вид из окна', 'night', 'belgorod'],
    ['Очень длинное название города для проверки троеточия',
      'Длинное описание для проверки ограничения в четыре строки. Вид из окна на улицу, дома, деревья, машины и людей. Продолжение описания, которое не должно увеличивать высоту карточки.',
      'afternoon', 'window'],
    ['Омск', 'Последнее окно в списке', 'night', 'belgorod'],
  ];

  window.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    if (url.origin !== apiOrigin || url.pathname !== '/api/videos') {
      return originalFetch(input, options);
    }

    const city = (url.searchParams.get('filters[city][$containsi]') || '').toLowerCase();
    const times = url.searchParams.getAll('filters[time_of_day][$eqi]');
    await new Promise((resolve) => setTimeout(resolve, 400));
    // Введите «ошибка», чтобы проверить ветку сетевой ошибки.
    if (city === 'ошибка') throw new TypeError('Тестовая ошибка сети');

    const filtered = cities.map(([city, description, time, image], index) => ({
      id: index + 1,
      city,
      description,
      time,
      thumbnail: { url: `/__mock__/${image}.jpg` },
      poster: { url: `/__mock__/${image}.jpg` },
      video: { url: `/__mock__/window.mp4?card=${index + 1}` },
    })).filter((item) => item.city.toLowerCase().includes(city) &&
      (!times.length || times.includes(item.time)));

    const page = Number(url.searchParams.get('pagination[page]') || 1);
    const pageSize = Number(url.searchParams.get('pagination[pageSize]') || 5);
    return new Response(JSON.stringify({
      results: filtered.slice((page - 1) * pageSize, page * pageSize),
      pagination: { page, pageSize, pageCount: Math.ceil(filtered.length / pageSize), total: filtered.length },
    }), { headers: { 'Content-Type': 'application/json' } });
  };
})();
