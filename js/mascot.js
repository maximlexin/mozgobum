// Маскот «Бум»: SVG с настроением и гардеробом.
// Слоты: hat (голова), face (лицо), neck (шея/спина), skin (цвет).
// rare: true — вещь нельзя купить, она выпадает только из золотого сундука.
// secret: true — вещь не видна в гардеробе, пока её не найдут.
MB.SLOTS = [['sets', '🎭', 'Образы'], ['hat', '🎩', 'Голова'], ['face', '🕶️', 'Лицо'], ['neck', '🎀', 'Шея'], ['hand', '🪄', 'В руке'], ['skin', '🎨', 'Цвет']];

// Готовые образы: покупка недостающих вещей со скидкой 20% и надевание одним нажатием.
MB.SETS = {
  santa:  { title: 'Дед Мороз', icon: '🎅', ny: true, items: ['santa', 'xmasscarf', 'gift'] },
  maiden: { title: 'Снегурочка', icon: '❄️', ny: true, items: ['kokoshnik', 'garland', 'candy'] },
  deer:   { title: 'Северный олень', icon: '🦌', ny: true, items: ['antlers', 'rednose', 'garland'] },
  elfset: { title: 'Эльф Санты', icon: '🧝', ny: true, items: ['elf', 'xmasscarf', 'sparkler'] },
  snowman: { title: 'Снеговик', icon: '⛄', ny: true, items: ['snow', 'bucket', 'carrot', 'xmasscarf'] },
  pirate: { title: 'Капитан Воробей', icon: '🏴‍☠️', items: ['pirate', 'eyepatch', 'cutlass'] },
  wizard: { title: 'Юный волшебник', icon: '⚡', items: ['hpglasses', 'gryff', 'wand'] },
  spider: { title: 'Паучок по соседству', icon: '🕷️', items: ['spider', 'cape'] },
  viking: { title: 'Бог грома', icon: '🔨', items: ['viking', 'hammer', 'cape'] },
  jedi:   { title: 'Рыцарь-джедай', icon: '🌌', items: ['hood', 'saber'] },
  straw:  { title: 'Король пиратов', icon: '👒', items: ['straw', 'scar'] },
};

MB.ITEMS = {
  // голова
  party:   { slot: 'hat', title: 'Колпак', price: 40, svg: '<path d="M44 34 L60 0 L76 34 Z" fill="#1cb0f6"/><path d="M50 22 L70 22 M47 28 L73 28" stroke="#ffc800" stroke-width="3"/><circle cx="60" cy="2" r="5" fill="#ff4b9b"/>' },
  cap:     { slot: 'hat', title: 'Кепка', price: 60, svg: '<path d="M30 34 Q60 6 90 34 Z" fill="#ff4b4b"/><path d="M84 32 Q104 32 108 38 L84 38 Z" fill="#d93636"/><circle cx="60" cy="16" r="4" fill="#fff"/>' },
  beanie:  { slot: 'hat', title: 'Шапка с помпоном', price: 80, svg: '<path d="M30 36 Q30 8 60 8 Q90 8 90 36 Z" fill="#ff4b9b"/><path d="M40 14 L40 34 M50 10 L50 34 M60 9 L60 34 M70 10 L70 34 M80 14 L80 34" stroke="#e0337f" stroke-width="2"/><rect x="28" y="30" width="64" height="9" rx="4" fill="#fff"/><circle cx="60" cy="6" r="7" fill="#fff"/>' },
  phones:  { slot: 'hat', title: 'Наушники', price: 120, svg: '<path d="M22 60 Q22 20 60 20 Q98 20 98 60" fill="none" stroke="#333" stroke-width="6"/><rect x="14" y="52" width="14" height="22" rx="6" fill="#ff8a00"/><rect x="92" y="52" width="14" height="22" rx="6" fill="#ff8a00"/>' },
  crown:   { slot: 'hat', title: 'Корона', price: 250, svg: '<path d="M34 34 L38 10 L50 24 L60 6 L70 24 L82 10 L86 34 Z" fill="#ffc800" stroke="#e5a800" stroke-width="2"/><circle cx="60" cy="26" r="4" fill="#ff4b9b"/>' },
  wizard:  { slot: 'hat', title: 'Шляпа мага', price: 400, svg: '<path d="M30 36 L66 -4 L90 36 Z" fill="#5b2bd6"/><ellipse cx="60" cy="36" rx="38" ry="7" fill="#4320a8"/><path d="M58 14 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1z" fill="#ffc800"/>' },
  pirate:  { slot: 'hat', title: 'Шляпа капитана Воробья', price: 350, svg: '<path d="M32 36 Q60 26 88 36 L88 41 Q60 31 32 41 Z" fill="#c92a2a"/><path d="M16 36 Q24 4 60 6 Q96 4 104 36 Q84 22 60 28 Q36 22 16 36 Z" fill="#3b2a1e" stroke="#e0a800" stroke-width="2"/><circle cx="60" cy="16" r="6" fill="#f1f3f5"/><circle cx="58" cy="15" r="1.6" fill="#222"/><circle cx="62" cy="15" r="1.6" fill="#222"/><path d="M55 22 L65 26 M65 22 L55 26" stroke="#f1f3f5" stroke-width="2"/><path d="M86 40 l4 14 M90 40 l5 12" stroke="#5c3d2e" stroke-width="3" stroke-linecap="round"/><circle cx="90" cy="55" r="2.5" fill="#e0a800"/>' },
  straw:   { slot: 'hat', title: 'Соломенная шляпа', price: 180, svg: '<ellipse cx="60" cy="32" rx="44" ry="9" fill="#f4d58d" stroke="#d9b45a" stroke-width="2"/><path d="M36 32 Q36 6 60 6 Q84 6 84 32 Z" fill="#f4d58d" stroke="#d9b45a" stroke-width="2"/><path d="M36 27 Q60 33 84 27 L84 32 Q60 38 36 32 Z" fill="#e03131"/>' },
  viking:  { slot: 'hat', title: 'Шлем викинга', price: 220, svg: '<path d="M34 28 Q20 22 12 2 Q28 12 38 20 Z M86 28 Q100 22 108 2 Q92 12 82 20 Z" fill="#f1e3c6" stroke="#cdb991" stroke-width="2"/><path d="M30 38 Q30 8 60 8 Q90 8 90 38 Z" fill="#adb5bd"/><rect x="28" y="32" width="64" height="8" rx="3" fill="#868e96"/><path d="M60 8 L60 32" stroke="#868e96" stroke-width="5"/><circle cx="40" cy="36" r="2" fill="#dee2e6"/><circle cx="80" cy="36" r="2" fill="#dee2e6"/>' },
  hood:    { slot: 'hat', title: 'Капюшон джедая', price: 160, back: '<path d="M14 80 Q10 20 60 14 Q110 20 106 80 Q96 50 60 44 Q24 50 14 80 Z" fill="#8a6a4a"/>', svg: '<path d="M22 46 Q24 16 60 14 Q96 16 98 46 Q86 30 60 30 Q34 30 22 46 Z" fill="#a0805c"/>' },
  plusstar: { slot: 'hat', title: 'Звёздная корона Плюса', plus: true, svg: '<path d="M32 34 L36 12 L48 24 L60 4 L72 24 L84 12 L88 34 Z" fill="#7c4dff" stroke="#ffc800" stroke-width="2.5"/><path d="M60 13 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1z" fill="#ffc800"/><circle cx="36" cy="12" r="3" fill="#ffc800"/><circle cx="84" cy="12" r="3" fill="#ffc800"/>' },
  halo:    { slot: 'hat', title: 'Нимб', rare: true, svg: '<ellipse cx="60" cy="8" rx="24" ry="6" fill="none" stroke="#ffe066" stroke-width="5"/><ellipse cx="60" cy="8" rx="24" ry="6" fill="none" stroke="#fff8c4" stroke-width="1.5"/>' },
  // лицо
  glasses: { slot: 'face', title: 'Очки', price: 80, svg: '<g fill="none" stroke="#222" stroke-width="3"><circle cx="45" cy="58" r="13"/><circle cx="75" cy="58" r="13"/><path d="M58 58 L62 58"/></g>' },
  shades:  { slot: 'face', title: 'Тёмные очки', price: 150, svg: '<rect x="31" y="50" width="27" height="16" rx="6" fill="#111"/><rect x="62" y="50" width="27" height="16" rx="6" fill="#111"/><path d="M58 56 L62 56" stroke="#111" stroke-width="3"/><path d="M35 54 L45 54 M66 54 L76 54" stroke="#fff" stroke-width="2" opacity=".5"/>' },
  mask:    { slot: 'face', title: 'Маска героя', price: 200, svg: '<path d="M26 52 Q60 40 94 52 Q94 70 76 67 Q60 61 44 67 Q26 70 26 52 Z" fill="#e03131"/><circle cx="45" cy="57" r="9" fill="#fff"/><circle cx="75" cy="57" r="9" fill="#fff"/><circle cx="47" cy="58" r="5" fill="#1d1340"/><circle cx="77" cy="58" r="5" fill="#1d1340"/>' },
  eyepatch: { slot: 'face', title: 'Повязка пирата', price: 60, svg: '<path d="M22 44 L98 66" stroke="#111" stroke-width="3"/><ellipse cx="45" cy="58" rx="13" ry="11" fill="#111"/>' },
  hpglasses: { slot: 'face', title: 'Круглые очки и шрам', price: 160, svg: '<g fill="none" stroke="#1d1340" stroke-width="2.5"><circle cx="45" cy="58" r="12"/><circle cx="75" cy="58" r="12"/><path d="M57 56 Q60 53 63 56 M33 56 L24 52 M87 56 L96 52"/></g><path d="M72 30 L66 37 L71 37 L65 45" fill="none" stroke="#c92a2a" stroke-width="2.5" stroke-linejoin="round"/>' },
  scar:    { slot: 'face', title: 'Шрам под глазом', price: 40, svg: '<path d="M36 70 L42 72 M37 74 L43 69" stroke="#a61e4d" stroke-width="2" stroke-linecap="round"/>' },
  spider:  { slot: 'face', title: 'Костюм паучка', price: 260, svg: '<circle cx="60" cy="66" r="42" fill="#d62828"/><g fill="none" stroke="#7a0f0f" stroke-width="1.2" opacity=".8"><path d="M60 24 L60 108 M18 66 L102 66 M30 36 L90 96 M90 36 L30 96"/><circle cx="60" cy="66" r="14"/><circle cx="60" cy="66" r="26"/><circle cx="60" cy="66" r="38"/></g><path d="M30 58 Q40 40 56 56 Q48 70 30 58 Z M90 58 Q80 40 64 56 Q72 70 90 58 Z" fill="#fff" stroke="#111" stroke-width="3"/>' },
  lexin:   { slot: 'face', title: 'Очки Максима Лексина', secret: true, svg: '<rect x="29" y="49" width="30" height="18" rx="5" fill="url(#lxLens)" stroke="#e0a800" stroke-width="2.5"/><rect x="61" y="49" width="30" height="18" rx="5" fill="url(#lxLens)" stroke="#e0a800" stroke-width="2.5"/><path d="M59 55 Q60 52 61 55 M29 55 L20 50 M91 55 L100 50" stroke="#e0a800" stroke-width="2.5" fill="none"/><path d="M33 53 L41 53 M65 53 L73 53" stroke="#fff" stroke-width="2" opacity=".7"/><path d="M96 40 l2 4 4 1 -4 2 -2 4 -2 -4 -4 -2 4 -1z" fill="#ffe066"/><text x="60" y="64" font-size="7" font-weight="900" text-anchor="middle" fill="#ffe066">МЛ</text>' },
  pixel:   { slot: 'face', title: 'Пиксельные очки', rare: true, svg: '<g fill="#111"><rect x="28" y="51" width="30" height="13"/><rect x="62" y="51" width="30" height="13"/><rect x="56" y="53" width="8" height="4"/></g><g fill="#fff"><rect x="32" y="54" width="7" height="4"/><rect x="66" y="54" width="7" height="4"/></g>' },
  // шея и спина
  bow:     { slot: 'neck', title: 'Бабочка', price: 70, svg: '<path d="M60 101 L45 93 L45 109 Z M60 101 L75 93 L75 109 Z" fill="#ff4b4b"/><circle cx="60" cy="101" r="4.5" fill="#d93636"/>' },
  scarf:   { slot: 'neck', title: 'Шарф', price: 90, svg: '<path d="M28 92 Q60 108 92 92 L92 101 Q60 117 28 101 Z" fill="#1cb0f6"/><path d="M28 96 Q60 112 92 96" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/><rect x="70" y="100" width="11" height="19" rx="3" fill="#1899d6"/>' },
  cape:    { slot: 'neck', title: 'Плащ героя', price: 300, back: '<path d="M26 66 Q20 108 10 120 L110 120 Q100 108 94 66 Z" fill="#e03131"/><path d="M26 66 Q20 108 10 120 L30 120 Q30 100 34 70 Z" fill="#b02525"/>', svg: '<path d="M36 92 L60 101 L84 92" stroke="#b02525" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="60" cy="101" r="5" fill="#ffc800"/>' },
  gryff:   { slot: 'neck', title: 'Шарф факультета', price: 120, svg: '<path d="M28 92 Q60 108 92 92 L92 101 Q60 117 28 101 Z" fill="#7f0909"/><path d="M36 97 L40 103 M50 100 L52 107 M66 101 L65 108 M80 98 L77 105" stroke="#ffc500" stroke-width="4"/><rect x="68" y="100" width="12" height="20" rx="2" fill="#7f0909"/><path d="M68 106 H80 M68 113 H80" stroke="#ffc500" stroke-width="3"/>' },
  buddy:   { slot: 'neck', title: 'Значок «Лучший друг»', referral: true, svg: '<path d="M50 86 L60 100 L70 86" stroke="#ff4b9b" stroke-width="4" fill="none"/><circle cx="60" cy="105" r="10" fill="#fff" stroke="#ff4b9b" stroke-width="2.5"/><path d="M60 110 C52 104 54 98 58 99 Q60 100 60 102 Q60 100 62 99 C66 98 68 104 60 110 Z" fill="#ff4b9b"/>' },
  medal:   { slot: 'neck', title: 'Медаль отличника', rare: true, svg: '<path d="M48 86 L60 102 L72 86" stroke="#1cb0f6" stroke-width="4" fill="none"/><circle cx="60" cy="106" r="9" fill="#ffc800" stroke="#e0a800" stroke-width="2"/><text x="60" y="110" font-size="10" text-anchor="middle" font-weight="900" fill="#7a5200">5</text>' },
  // в руке (лапка рисуется сама)
  wand:    { slot: 'hand', title: 'Палочка волшебника', price: 200, svg: '<path d="M98 92 L118 54" stroke="#5c3d2e" stroke-width="4" stroke-linecap="round"/><path d="M104 81 L106 77" stroke="#3b2a1e" stroke-width="5"/><g fill="#ffe066"><path d="M119 44 l2 5 5 1 -5 2 -2 5 -2 -5 -5 -2 5 -1z"/><circle cx="110" cy="44" r="1.5"/><circle cx="124" cy="56" r="1.5"/></g>' },
  cutlass: { slot: 'hand', title: 'Пиратская сабля', price: 150, svg: '<path d="M100 88 Q124 66 116 30 Q112 62 96 84 Z" fill="#dee2e6" stroke="#adb5bd" stroke-width="1.5"/><path d="M92 86 Q100 80 106 90" stroke="#e0a800" stroke-width="4" fill="none" stroke-linecap="round"/>' },
  saber:   { slot: 'hand', title: 'Световой меч', price: 300, svg: '<path d="M100 84 L122 26" stroke="#4dabf7" stroke-width="10" stroke-linecap="round" opacity=".35"/><path d="M100 84 L122 26" stroke="#e7f5ff" stroke-width="4" stroke-linecap="round"/><path d="M95 98 L101 82" stroke="#495057" stroke-width="7" stroke-linecap="round"/><path d="M96 94 L98 89" stroke="#adb5bd" stroke-width="7"/>' },
  hammer:  { slot: 'hand', title: 'Молот грома', price: 350, svg: '<path d="M98 100 L106 66" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/><rect x="92" y="48" width="30" height="20" rx="3" fill="#868e96" transform="rotate(14 107 58)"/><rect x="92" y="48" width="30" height="5" rx="2" fill="#adb5bd" transform="rotate(14 107 58)"/><path d="M84 40 l6 6 -4 2 6 6" stroke="#ffe066" stroke-width="2" fill="none"/>' },
  // мем «6-7»: лапки с табличками качаются вверх-вниз; открывается за 7 правильных подряд
  sixseven: { slot: 'hand', title: 'Жест «6-7»', combo67: true, noPaw: true, svg: '<g class="p67 p67-l"><rect x="2" y="50" width="24" height="26" rx="7" fill="#ff4b9b" stroke="#fff" stroke-width="2"/><text x="14" y="70" font-size="19" font-weight="900" text-anchor="middle" fill="#fff" font-family="Nunito,Arial,sans-serif">6</text><ellipse cx="14" cy="83" rx="9" ry="8" fill="{feet}"/></g><g class="p67 p67-r"><rect x="94" y="50" width="24" height="26" rx="7" fill="#1cb0f6" stroke="#fff" stroke-width="2"/><text x="106" y="70" font-size="19" font-weight="900" text-anchor="middle" fill="#fff" font-family="Nunito,Arial,sans-serif">7</text><ellipse cx="106" cy="83" rx="9" ry="8" fill="{feet}"/></g>' },
  // ❄️ Новый год (ny: true — значок «Новый год» в гардеробе)
  santa:    { slot: 'hat', title: 'Шапка Деда Мороза', price: 90, ny: true, svg: '<path d="M34 34 Q38 6 66 6 Q92 8 100 28 L86 34 Z" fill="#e53935"/><path d="M40 20 Q52 10 66 12" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/><rect x="28" y="30" width="64" height="11" rx="5.5" fill="#fff"/><circle cx="100" cy="29" r="6.5" fill="#fff"/>' },
  elf:      { slot: 'hat', title: 'Шапка эльфа', price: 100, ny: true, svg: '<path d="M32 38 Q40 10 86 4 Q78 22 90 38 Z" fill="#2e9d4f"/><path d="M32 38 L90 38" stroke="#c62828" stroke-width="6" stroke-linecap="round"/><path d="M40 30 l5 -8 l5 8 M58 30 l5 -10 l5 10" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/><circle cx="87" cy="5" r="5" fill="#ffc800"/><circle cx="86" cy="4" r="1.6" fill="#fff" opacity=".8"/>' },
  antlers:  { slot: 'hat', title: 'Оленьи рожки', price: 80, ny: true, svg: '<g stroke="#8a5a35" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M42 26 Q34 10 26 4 M36 16 Q28 14 22 16 M40 22 Q34 16 28 14"/><path d="M78 26 Q86 10 94 4 M84 16 Q92 14 98 16 M80 22 Q86 16 92 14"/></g>' },
  kokoshnik: { slot: 'hat', title: 'Кокошник Снегурочки', price: 120, ny: true, svg: '<path d="M33 36 Q34 8 60 6 Q86 8 87 36 Z" fill="#5bc0f0"/><path d="M33 36 Q34 12 60 10 Q86 12 87 36" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6"/><g fill="#fff"><circle cx="40" cy="30" r="3"/><circle cx="50" cy="22" r="3"/><circle cx="60" cy="19" r="3.4"/><circle cx="70" cy="22" r="3"/><circle cx="80" cy="30" r="3"/></g><path d="M60 8 l0 -5 M57 5 l6 0" stroke="#fff" stroke-width="2"/>' },
  bucket:   { slot: 'hat', title: 'Ведро снеговика', price: 60, ny: true, svg: '<path d="M38 36 L44 10 L76 10 L82 36 Z" fill="#9aa4b2"/><path d="M44 10 L76 10" stroke="#c5cdd9" stroke-width="3"/><ellipse cx="60" cy="36" rx="25" ry="5" fill="#7d8796"/><path d="M48 16 L51 32" stroke="#fff" stroke-width="2" opacity=".35"/>' },
  rednose:  { slot: 'face', title: 'Красный нос Рудольфа', price: 40, ny: true, svg: '<circle cx="60" cy="70" r="7" fill="#ff3b3b"/><circle cx="58" cy="67.5" r="2.2" fill="#fff" opacity=".7"/>' },
  carrot:   { slot: 'face', title: 'Морковный нос', price: 40, ny: true, svg: '<path d="M57 67 L80 72 L57 77 Z" fill="#ff8a00"/><path d="M62 69 l3 4 M68 70 l2 3" stroke="#d96f00" stroke-width="1.5"/>' },
  xmasscarf: { slot: 'neck', title: 'Новогодний шарф', price: 70, ny: true, svg: '<path d="M28 92 Q60 108 92 92 L92 101 Q60 117 28 101 Z" fill="#e53935"/><path d="M40 98 L42 107 M54 101 L55 110 M68 101 L68 110 M82 98 L80 107" stroke="#fff" stroke-width="3.5"/><rect x="68" y="100" width="12" height="21" rx="3" fill="#e53935"/><path d="M68 107 H80 M68 114 H80" stroke="#fff" stroke-width="3.5"/>' },
  garland:  { slot: 'neck', title: 'Гирлянда', price: 90, ny: true, svg: '<path d="M26 88 Q60 118 94 88" stroke="#2e7d32" stroke-width="2.5" fill="none"/><g class="bulbs"><circle class="bulb" cx="34" cy="96" r="4.5" fill="#ff5252"/><circle class="bulb" cx="46" cy="104" r="4.5" fill="#ffd740"/><circle class="bulb" cx="60" cy="107" r="4.5" fill="#40c4ff"/><circle class="bulb" cx="74" cy="104" r="4.5" fill="#ff80ab"/><circle class="bulb" cx="86" cy="96" r="4.5" fill="#69f0ae"/></g>' },
  gift:     { slot: 'hand', title: 'Подарок', price: 110, ny: true, noPaw: false, svg: '<rect x="92" y="74" width="24" height="22" rx="3.5" fill="#e53935"/><rect x="102" y="74" width="4.5" height="22" fill="#ffd54f"/><rect x="92" y="83" width="24" height="4.5" fill="#ffd54f"/><path d="M104 74 q-9 -11 -13 -4 q4 7 13 4 M104 74 q9 -11 13 -4 q-4 7 -13 4" fill="none" stroke="#ffd54f" stroke-width="2.5"/>' },
  sparkler: { slot: 'hand', title: 'Бенгальский огонь', price: 100, ny: true, svg: '<path d="M98 94 L116 54" stroke="#8d8d8d" stroke-width="3" stroke-linecap="round"/><g class="bulbs" fill="#ffe680"><path class="bulb" d="M118 48 l2 5 5 1 -5 2 -2 5 -2 -5 -5 -2 5 -1z"/><circle class="bulb" cx="110" cy="46" r="2"/><circle class="bulb" cx="124" cy="58" r="2"/><circle class="bulb" cx="116" cy="40" r="1.6"/><circle class="bulb" cx="126" cy="48" r="1.6"/></g>' },
  candy:    { slot: 'hand', title: 'Леденцовый посох', price: 70, ny: true, svg: '<path d="M104 100 L104 60 Q104 48 114 48 Q122 48 122 56" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M104 100 L104 60 Q104 48 114 48 Q122 48 122 56" stroke="#e53935" stroke-width="7" fill="none" stroke-dasharray="6 7" stroke-linecap="butt"/>' },
  // цвет тела
  snow:     { slot: 'skin', title: 'Снежный', price: 160, ny: true, grad: 'mb-snow', feet: '#8fc0ea', belly: '#ffffff' },
  purple:  { slot: 'skin', title: 'Фиолетовый', price: 0, grad: 'mb-purple', feet: '#5b2bd6', belly: '#c9b8ff' },
  mint:    { slot: 'skin', title: 'Мятный', price: 150, grad: 'mb-mint', feet: '#0c8f7c', belly: '#c3f7ea' },
  fire:    { slot: 'skin', title: 'Огненный', price: 200, grad: 'mb-fire', feet: '#c2410c', belly: '#ffd8b0' },
  ice:     { slot: 'skin', title: 'Ледяной', price: 200, grad: 'mb-ice', feet: '#1971c2', belly: '#d8efff' },
  gold:    { slot: 'skin', title: 'Золотой', price: 500, grad: 'mb-gold', feet: '#b57a00', belly: '#fff3c4' },
  galaxy:  { slot: 'skin', title: 'Космос', rare: true, grad: 'mb-galaxy', feet: '#24135e', belly: '#9d8cff' },
};

// look — объект {hat, face, neck, skin}
MB.mascot = (mood = 'happy', look = null) => {
  const lk = look || {};
  const item = slot => (lk[slot] && MB.ITEMS[lk[slot]]) || null;
  const skin = item('skin') || MB.ITEMS.purple;
  let mouth, eyes;
  const pupils = mood === 'wow'
    ? '<circle cx="45" cy="58" r="7" fill="#1d1340"/><circle cx="75" cy="58" r="7" fill="#1d1340"/>'
    : '<circle class="pupil" cx="47" cy="59" r="6" fill="#1d1340"/><circle class="pupil" cx="77" cy="59" r="6" fill="#1d1340"/>';
  const shine = '<circle cx="49" cy="56" r="2.2" fill="#fff"/><circle cx="79" cy="56" r="2.2" fill="#fff"/>';
  eyes = `<g class="eyes"><circle cx="45" cy="58" r="11" fill="#fff"/><circle cx="75" cy="58" r="11" fill="#fff"/>${pupils}${shine}</g>`;
  if (mood === 'sleep') eyes = '<path d="M36 60 Q45 66 54 60 M66 60 Q75 66 84 60" stroke="#1d1340" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
  if (mood === 'sad') mouth = '<path d="M50 86 Q60 78 70 86" stroke="#1d1340" stroke-width="4" fill="none" stroke-linecap="round"/>';
  else if (mood === 'wow') mouth = '<ellipse cx="60" cy="83" rx="7" ry="8" fill="#1d1340"/><ellipse cx="60" cy="86" rx="4" ry="3" fill="#ff7aa8"/>';
  else if (mood === 'sleep') mouth = '<ellipse cx="60" cy="82" rx="4" ry="3" fill="#1d1340"/>';
  else mouth = '<path d="M47 77 Q60 94 73 77 Z" fill="#1d1340"/><path d="M53 84 Q60 90 67 84 Q60 82 53 84Z" fill="#ff7aa8"/>';
  const brows = mood === 'sad' ? '<path d="M36 44 L52 48 M84 44 L68 48" stroke="#3c1f8a" stroke-width="3" stroke-linecap="round"/>' : '';
  const back = ['hat', 'face', 'neck'].map(s => (item(s) && item(s).back) || '').join('');
  const paw = item('hand') && !item('hand').noPaw ? `<ellipse cx="98" cy="90" rx="9" ry="8" fill="${skin.feet}"/>` : '';
  const front = (['face', 'neck', 'hat', 'hand'].map(s => (item(s) && item(s).svg) || '').join('') + paw).replace(/\{feet\}/g, skin.feet);
  return `<svg class="mascot mood-${mood}" viewBox="-6 -8 132 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${back}
    <ellipse cx="60" cy="114" rx="34" ry="5" fill="#000" opacity=".12"/>
    <path d="M60 26 Q52 10 62 4 Q60 14 70 18 Q72 8 80 10 Q72 18 72 30 Z" fill="#ffc800"/>
    <ellipse cx="44" cy="108" rx="11" ry="6" fill="${skin.feet}"/><ellipse cx="76" cy="108" rx="11" ry="6" fill="${skin.feet}"/>
    <circle cx="60" cy="66" r="42" fill="url(#${skin.grad})"/>
    <ellipse cx="60" cy="80" rx="24" ry="18" fill="${skin.belly}" opacity=".55"/>
    <circle cx="33" cy="74" r="6" fill="#ff7aa8" opacity=".6"/><circle cx="87" cy="74" r="6" fill="#ff7aa8" opacity=".6"/>
    ${brows}${eyes}${mouth}${front}
  </svg>`;
};
