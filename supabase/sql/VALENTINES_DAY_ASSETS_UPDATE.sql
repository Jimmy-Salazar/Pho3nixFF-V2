-- OPCIONAL: usar solo cuando el theme San Valentín ya se gestione remotamente desde app_themes.
-- Para el preview manual actual NO hace falta ejecutar este SQL.

update public.app_themes
set
  login_image_url = '/themes/valentines-day/images/home-wide-02.webp',
  home_image_url = '/themes/valentines-day/images/home-wide-01.webp',
  dashboard_image_url = '/themes/valentines-day/images/home-wide-01.webp',
  home_background_url = '/themes/valentines-day/images/home-wide-01.webp',
  home_background_mobile_url = '/themes/valentines-day/images/home-mobile-01.webp',
  home_monument_url = '/themes/valentines-day/images/empty.svg',
  home_brand_word_url = '/themes/valentines-day/images/empty.svg'
where theme_key = 'valentines_day';
