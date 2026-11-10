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
  giftHashes: ['694d36d8de454e1d8f71b9b44d82913d3ed199965394aba2bc5205334f743d6d'],
  // Код включения режима разработчика (для телефона, где нельзя открыть ссылку с ?dev) — тоже только SHA-256.
  // Код «без рекламы» (без Плюса): только SHA-256, например для брата.
  noAdsHashes: ['59423045e6d61c7aff6ac19a717d7933281b66f51fc7b99c2bfaccf095c47e13'],
  // Коды «Плюс на 30 дней» для ручной выдачи после оплаты: только SHA-256 кодов (хэш → дней). Сами коды лежат у владельца в ops/plus-codes/.
  plusCodes: {
    '883c2fecb4b0b12c5c9252cd4057f47b19b9b65083d3da35e678e0b69ffc5d4a': 30,
    'c433610c8333b010fcabad300c16812d23020d65d26de9fbf6ffc655ce4ac910': 30,
    '5fa01c0f6cfaf28207021625aa119df746f88e53e506024b425c33bc326d2936': 30,
    'cb4f78db5e7ff2a32d3e488926972a877407d8153699741a44967bc41a4fdd90': 30,
    '154eaba26d6d95e80471971cc8f6cfb1c9cb55b832032d01e3936fa5f50b8205': 30,
    '2a536720e383951f23534b2c65231b9e4a132fdadd3aaf6796e072501ef8e2c6': 30,
    '830feb418214b28131ce7e0be79a2a6b123f9e583965ca115c6f3365ed58e5bc': 30,
    'a97f481e0b70adfb77a4a848b07c706ceefc80e844bb188817f9bf565d433d9e': 30,
    '2820ef882869a1f63625124a3a87a033448d8f2b5d99a1c0a7fb88b99ca1393d': 30,
    'df51534dba3d4b3bd2f575e27fb740b7f3efd55a9a9f8f40355f549a048d3b9b': 30,
    '088e38b32eb438977a345bd1bc5c8b43ecdda3b89f2d136fbf31a27d719c9c22': 30,
    'ff70f913caa546b72d819b707b6e054420698d5ff2e3b6ab3400b321bf02725d': 30,
    '1d345be3f5f65766c1c59ea22b7c8401a85dd9c369f8af2bbb1dd0cbe41e97a2': 30,
    '3a12a88453c609fe393190f6634a96f4ff2d9613be4e61f319c6e7e88c939c40': 30,
    'e0abd451e116ae791a9b0bea944bc5d501b2fb269f4af711e04ae322eb614649': 30,
    'a9d78a5297317707b67e775f120f0bebd7ad5a4a27e5b34e031885428cc58b21': 30,
    '4f2773d50a148ebde9bd5dee2312d72e50f0d12306ca380bcabbfc8cb82f5e81': 30,
    '7bdd936f1c0ba8a8b2700ee2125f6c97fad07c3dc0806cce6581993218f51318': 30,
    '3f135452970dee717a8bc3e60ab6d35ffa2dcb3d43a9300b8e9ab3b35ea6c644': 30,
    '8af56e212ae5376a8fa16f4f231971ccb086d977b1f155f0a7e49be23ec2363f': 30,
    'd2cec6031060ad9d5a7d37689d4e807ca011e7d740a98cac6e5f2f70273aa2c4': 30,
    '39f5805b0ecb1aea5e177963620d57eaedf5a58bf29475b86175960586447298': 30,
    'a7fba38645a676713b52bed55b7ebdb74f7e06c4f92d8921d8806cbf0e5ce188': 30,
    'f9e38094aeb962fe0d2bad7c41f16a8a7908a0a95d541b3753d8cbe5207ff990': 30,
    '2e03e1afc72ab6b4ee822960a778d6a812167f06e91a499977533ef2c3762bb0': 30,
    'ee29bb7c3c0a108d68756b07102399339838092f9279e82e90fd90a27d2d74fe': 30,
    '0b86858b4486f0d1c65356eb42942e65bf7adf7f6f8f5057013584828e651762': 30,
    '42162b63966210daef79a19b41383ffe57f6baba3799c6ed323446c681eef1b4': 30,
    '34ee63ab4b74dba5cbcd9a0143e5a7f20dd4dd94ea702473d9c055ad84837407': 30,
    '64344b5c7ed18222215cfcd11aadc40c264ff96f8e2fc412074f14ec6c8c74f2': 30,
    '1e89e4361002a25817a80f0bd5223f936b74c265f6db9dc2c294707901acb683': 30,
    '03b095ebf802ab92594a1cf99a7b0ceb395e414a06d0b459c491a63b8dcb2300': 30,
    'd8c6aa0ddc2cc20d0e6d2f054a509bcfc1d989f764e72d716459fd1606ad2e98': 30,
    'fb50144b841131c391072fec244d9b6de39f142788544a6bcba19311e03a5391': 30,
    '285ceca6333092855653fc079ab3a8743c1ecb6d027499a169a2d62ab25af02d': 30,
    '1dab79db910cac787b69b17d93684ad3d9d0346508146e1522491a37b0fae749': 30,
    '618692ab31595b051581c70938c0df94c84224c6baedfb303b4ce8f5702ad582': 30,
    '10f48c8ed0b0211f8feb61acdcd085e22d513dd803af50be5972ac497c27f6eb': 30,
    'db21ac143a375125ed207633cd77d2c015c4e5927884cd2fef93f79d597b8fd1': 30,
    'b727a04e04108bf9e33702221a87a1f4509f1c4a4b878a25263a3371d38f7a4a': 30,
    '665f81978c80771738f7477c09ad4e97a01828acb28c0f380e7e5d509037e97e': 30,
    'fec140a51245e5f8a5c92a96cff8c8ba966a4ae1f86f6da916bdbbce138a1e3a': 30,
    'e761d75ca2a2d854eb98b8e09209bbfce3abe9a92e9dfd59ecfd05b8a1568c70': 30,
    '85b6521329a20505953ec6e879c7ee99d58e53ac1c859f5b0db97321a6a6486a': 30,
    'ac862e72ff6e98dedef3898b944f5681f33f4c21fcaa555bd82c8f45e3a5cc07': 30,
    '31f3bdcdfd8a2fbab7c36c92fe4436a026d373a1183cc36f1e4e48a3676add93': 30,
    'b60b812ff42671ec6c39b8efecedc5679be7ae502c644ab978df3f46b46afb0d': 30,
    '341c3aa26f459d1879664d1a0308342d12474b38a5b09d7e05dc8bec4b4742f2': 30,
    '0e662f14aad77f05c4c05d99b94692d94fb905a1f34eaa827e0703d12a15a7e9': 30,
    '0edc9d0de18f7d5d537393e1bff691248d41b98f28763eba98435e49cd5a0c76': 30,
    'ea8351a25454fc0f60f8c6a97a0327ce45830eee4285beaf86211cf6acc34af4': 30,
    '49be62918a08d3f3585b4f4ab56deed25551774a4f96a934c6438fd3dc636e2c': 30,
    '4d4ffc79e17c57535d7188f6ca87221a4076553cb50ca72743abf5cd3337dcd8': 30,
    'f5e3f3761101cf7eb5cbddd0f736e888e02cc84be30c23e0e64f8e7a92746a3f': 30,
    'e3f7eee2b10bc22d8161ab5ac3288b53e58e59abb5ed3278496c09498935d2ee': 30,
    'cb7943f0832fc97a6f891aa9e442b36b987328881fdd5e1642362c23d1ff09e3': 30,
    'dc54987767120a0e59b1ff53d7d7867989c1c1a99069cabf60c8c5846b436990': 30,
    'a75a06140784c6ed1da9c054bc41d3a3166c375d07dcb734b419af1f12f3c638': 30,
    '878ef13970f2c6b575052949dad905ebf4a61aeb777b030184cdc0a750b6ba86': 30,
    'b5e3d2c7d95a352757b8ba138338ad47bcee6c8aae21134dd375a9b98f53b13a': 30,
  },
  // Ссылка многоразового счёта ЮKassa (пока пусто). Если задана и нет payApi, в «Магазине» появляется кнопка «Купить».
  payLink: '',
  plusCodesUntil: '2027-06-30',   // после этой даты коды не принимаются
  devHashes: ['fbf25162faca77ca645f3e1045d8e41a1d90ab2ed80c7f6a70dd6275c7866f43'],
};
