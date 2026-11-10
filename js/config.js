// Настройки подключения к серверу. Пока supabaseUrl пустой, игра работает полностью офлайн:
// без аналитики и облака, покупка «Плюса» — тестовая, прямо на устройстве.
// anon key — публичный ключ Supabase, его можно хранить в коде (доступ ограничен правилами RLS).
MB.CONFIG = {
  supabaseUrl: '',   // облако ОТКЛЮЧЕНО 5 ноября 2026: сервер в Германии не используем (152-ФЗ, ч. 5 ст. 18). Включить после переноса на сервер в РФ
  supabaseAnonKey: '',
  emailLogin: false,        // вход по почте: включать только осознанно (почта — персональные данные, сервер вне РФ)
  // Переключатели выпуска: plus — карточка покупки «Плюса»; legal — экран согласия и ссылки на документы.
  // Включать, когда готовы оплата и документы с реквизитами. Без legal облако не включается (нет согласия).
  features: { plus: true, legal: true },
  appVersion: '1.1.0',
  plus: { sku: 'plus_30', price: 49, days: 30 },
  // Адрес платёжного сервера (backend/pay-server). Пусто: оплата выключена, кнопка «оплата скоро откроется».
  payApi: '',
  docsVersion: '1.0',
  // Подарочные промокоды на бессрочный Плюс: здесь только SHA-256 кодов, сами коды не хранятся.
  giftHashes: ['4c499fac4eb91dc2d8dc6202d6aa0bb49d9e2f8bf9e6a7a158cfc819d9038aa4'],
  // Код включения режима разработчика (для телефона, где нельзя открыть ссылку с ?dev) — тоже только SHA-256.
  // Код «без рекламы» (без Плюса): только SHA-256, например для брата.
  noAdsHashes: ['0e71586d4931bf727f74e43c83e36246f20863ad43c8c3768ad162cbe74bbf36'],
  // Коды «Плюс на 30 дней» для ручной выдачи после оплаты: только SHA-256 кодов (хэш → дней). Сами коды лежат только у владельца в C:\mozgobum-secrets\.
  plusCodes: {
    '334b766a93fa3013535c01556b66ae513b5d1b7f3641d88ec7d7ea83bd8dc6dc': 30,
    '7953f2ef2a13aa8182dc586d7a635454c2e8d6c12914c9c7e5634d25904fe615': 30,
    '7c1a017978be50df8d836b2e92ee36d376b5e3a3920baa6332855050562a3b85': 30,
    'be38baf519c8d8c17b2d83d76e350f2ed7c4baba8ca6697a449f019db5b73467': 30,
    '70d9eae89797fe65273d12f85b9d39398a28c94daaab0344ca70cb55317d30b7': 30,
    'ca333b705937e0c62123c791e6348d4850b0f09bed9476c97b0e31280037f71b': 30,
    'e79590a333f135afa549b0fb1ad5854851993220f09e5ef104a59edcf18de7e5': 30,
    'b5487007009bf76dd06e214a9216d4d7f1684461e0db9e177134e5648f1ff9ec': 30,
    '2253d806f87fbfce53a018eef2880e61ac32e7a6b659cc7d3ac7fdead7a72ac5': 30,
    '705027907b5bee0ab2f333b4fca046a633be03c8215fa4c023f08f18bb0c128a': 30,
    'da2fb31b4f2a883605202d0a05498a63156225cfc5fdd68714c9f4b20713ca21': 30,
    'ec405040a2c1417587fa91d41511e515df09e6f43d8b0f0e4eb0a8387e876d60': 30,
    '1fb5ab395daf2ce8f9b16e3b24f09f434f201337e2b08ddbf506e49ee7a72b77': 30,
    '8a11f4f4f5a8a9d5eea58be3718920bb562d30ba462c30ce0385bff3aae94c0a': 30,
    'faa31e79b059e8e491dcc29d99d037e1eff65b143ab3e6a688621707a0863664': 30,
    '1b608505d8085ced04838fcc7fbb10a7b37a9df6fcf770087664a879c6db0604': 30,
    'f81b42c2923be4a9598df9b2bcc2c9b0a1815c9d297a5f2205d70a9e3667457f': 30,
    '7fcbc795356d66b7e9c9a97b2faacb583c531633c2546c0d802e2a79a0fe4501': 30,
    '23275de65ff5c75cbce56974bde0ac8b3a4c3e62aee0fe4921dd6b093b88ee8d': 30,
    '17d9e69777a4f391629a07ebde649f423880f3e4c8c9865029f488ccaee8f760': 30,
    '4a9b3733638bc862233161e1c1bf8e6286085ed0f6f04fa48b6a992f53dfbdcb': 30,
    'a0495bd936ad2278ef59b4ab6d0eda610b4aecc10ed67f7d94337a20dccd15bc': 30,
    '4fa59f11a7869e1fc1af632b9a8fe0e12ffd7264624d5be91202c3effebc33fc': 30,
    '23c8ed73a2147665c75e978d5faf880b3c4faf533c160b1e4df1d1f0c3c9fe00': 30,
    'a00af160fbfa47643eaf288794c3582cc584d5920948786b8af1f96118ee4918': 30,
    '8af3567887307e414a7faebb3d13d91ae160acc459414adccf4f470190ab3928': 30,
    '46cdf030fcb740971ef7e18af49e85cf584ec1da95f726328d507dec144fb522': 30,
    '5cffd10aa994df98d6ad478642edab3ca2c00ae13224ef04d08ed35d1a88b5ca': 30,
    'a885ea1cfb2a1ec58472cce4c611fcf9f37315af7a9beeb8619dc5c28add7d98': 30,
    'fecfda093b25bded6a70afd4167919d2dad1cd77cfe0d08d3d356b947f7f11f6': 30,
    '4b2e58f7efbd629ed9348fb239d7eb9979236afddc7dba3f603e82c9370d3855': 30,
    '920011a29384c6d7b3e045593f6216cf6e84cf2e3d6d12771b4d05bc8ba7b75b': 30,
    '9a57dae1c91a161b32c42760c3d60fdb24671b812084a9c20164894368e24132': 30,
    'f18fa00af63e4c5ef1b2633a042a750b5f3ccc12ea7e0273e323847a2f637e98': 30,
    '157174795a1752b0790010448fef45d71c294013a81aec7c89d94f7d7f34684f': 30,
    '2aafc209501d10ad478db57d2644a44c3fc3e98facaca3808fc916f502ab6dc4': 30,
    'fc0af0829ae08ba25826126c0097679e902174bb248f5b3812f094e85b6729a4': 30,
    '55b1ce63447193ce759643025514ede042731d7555328b6c6f245dc0a7cb18cb': 30,
    'cdb42a871164f8030e1f750909d63bbc512cdd040be099ef5736581d9c831e2b': 30,
    'ae07e52e112eea4330622fe9ed43bef359cb7c0087344a41c2ff82bffb27c11e': 30,
    'ad1aa8fd546e5b05f7241f400a4571a8cd8747b841599074ef1e3b1fcb277f6e': 30,
    'f82d9bdd80a329b173995c2fa3dc9898780ce1e828954c325a8696646e34eb90': 30,
    '92c4999c593ea0837a7344ba8ef9006e8a44f0809b7f10da28f6c3396db13eed': 30,
    'e47a45e940378765745b6ced5c76161dc2193fa0686a6c4d4de58f394a5ea54d': 30,
    '5b5a35ee83bd2995c11944bd3eda7c3538b9b426d43ca9d4387e766b10023dad': 30,
    '523d1bc94229bdf4f57813e513bd116efca6c339e8f8a83f0afe40749ffbd9f8': 30,
    'f0dc9e8774d4c8a2062dc130a1214736ebb82c9c6f2f464c44b1951c4c256e88': 30,
    '242318ff28dff27bdfbe3fd8f0210fd0e4bd68798817eecc0254eea81e325aae': 30,
    '496f1964ca6ae1ea4ef2dcd6dc9684930932631798984a17feafc4da3858e56c': 30,
    '761e9c9f4e32a07b80dc2aee14613f0c77d4b80506010db07ad3c547e89f1c4e': 30,
    'e0f1984273a5360a5026bd6ea0f5fc2c286d7b175f2ddd100f92d9b226b81083': 30,
    '34765d00f56bd7a98db765f0ed4268168d1308bc0efc4bb0f0913f3c9a3e87fb': 30,
    'e580fad18a1dcd0d0849f373c0b9cb1035aa0f6d3e499bf60adcead0c01097ea': 30,
    'c3dd0c0eb6bef25ef3ee90a7577b6273399f4bb4009c7c5473bd08fc63121057': 30,
    'ca05843422a75f6c0c7040510fb28240d7cf03873cfa7003d02626b607e39886': 30,
    '63d03195b2b9c791c863b0ff5081e479694cc776b11d8c150e3c80320d357e88': 30,
    '9fdc5df1c4771be2d3c73c5c3b62f55f5443573493d5929f9ab539d9fdc65147': 30,
    'fb4b144e4b2935e8300f41615f6cc45133826286c07bed485c5012f5c340ea64': 30,
    'e4193a6c818833cd39c6232f0263175a9af1a618170e52d8b9ccd19089ac7924': 30,
    '7a470a809e8f2d6ad56f4fdd7b094a64a32173821a7d3a30e783ea27f32add7a': 30,
  },
  // Ссылка многоразового счёта ЮKassa (пока пусто). Если задана и нет payApi, в «Магазине» появляется кнопка «Купить».
  payLink: 'https://yookassa.ru/my/i/avMEo32g-o8s/l',
  plusCodesUntil: '2027-06-30',   // после этой даты коды не принимаются
  devHashes: ['12b738cfc85c0c4daa985f428c07621e89616ea19a518407a717929658dfce93'],
  // Хэши отозванных кодов «Плюс»: такой код не активируется («Этот код отозван»)
  plusRevoked: [],
};
