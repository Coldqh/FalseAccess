export type OnionPageId = 'home' | 'index' | 'forum' | 'market' | 'escrow' | 'inbox' | 'fake-mirror';

export const onionAddresses: Record<Exclude<OnionPageId, 'home'>, string> = {
  index: 'elwxtivoyjbo5a4esfub2qrwxox7pw7lt2vj5ncdv2dyejtd47c7zoh7.onion',
  forum: 'fq5v6dfttxpmrjg2ad7nbumnhu4pwma7jygvt6lrb6k2ybwfm3x5cnub.onion',
  market: 'weig2chcvuwacmhnryeetpjbgjuavfj4ep4h2g3t3swik3hgr7rit7pa.onion',
  inbox: 'ej4yuuc36nftarwvdpz2qqijyg4u6ikj3rgqlygy7cjjujnwol76hhla.onion',
  'fake-mirror': 'fv5z2pvei5r5hnjz43ttk2nansmigumatbuc7ocwnwrzn7igz32uifip.onion',
  escrow: 'djgn2trqv2fj5ecyvdq5g32o4r3z3dtccfgjukqyamd7bp3yr4sjmomx.onion',
};

export const onionFingerprint = 'B4A1 07D2 8F61 4CE9 5B32  719A 63D0 0C77 8A11 E204';

export const darknetDirectory = [
  { id: 'forum' as const, title: 'SALT ROOM', category: 'FORUM', description: 'Арбитраж, репутация, разборы провалов и закрытые технические разделы.', status: 'online' },
  { id: 'market' as const, title: 'BLACK LEDGER', category: 'MARKET', description: 'Вымышленный рынок запрещённых товаров, доступов и услуг. Только текстовые карточки.', status: 'online' },
  { id: 'escrow' as const, title: 'GREYLOCK', category: 'ESCROW', description: 'Гарант сделок, споры, заморозка депозитов и история арбитража.', status: 'online' },
  { id: 'inbox' as const, title: 'DEAD LETTER', category: 'MAIL', description: 'Одноразовые ящики и сообщения по приглашениям.', status: 'online' },
];

export const forumThreads = [
  { title: 'Поддельные зеркала Salt Room', author: 'mod_8', replies: 84, tag: 'PINNED', excerpt: 'Сверяйте полный адрес и подпись каталога. Совпадение названия ничего не доказывает.' },
  { title: 'Blackpost: кто закрыл цепочку?', author: 'grain', replies: 19, tag: 'OPS', excerpt: 'Ищут исполнителя, который связал raw EML, endpoint и OAuth. Оплата через гаранта.' },
  { title: 'Спор по замороженному депозиту', author: 'boreal', replies: 42, tag: 'ESCROW', excerpt: 'Заказчик изменил условия после передачи отчёта. Нужны логи переписки.' },
  { title: 'Сгоревшие псевдонимы июля', author: 'coldindex', replies: 137, tag: 'OPSEC', excerpt: 'Повторное использование аватаров, одинаковые часы активности и общие фразы в сообщениях.' },
];

export const marketListings = [
  { title: 'Пакет доступов к логистике', vendor: 'dockhand', price: '0.018 XMR', category: 'ACCESS', rating: '4.7 / 5', note: 'Листинг без технических деталей. Проверка продавца через гаранта.' },
  { title: 'Незарегистрированное оружие', vendor: 'ironbay', price: '0.31 XMR', category: 'WEAPONS', rating: '4.3 / 5', note: 'Вымышленный товар. Изображения и инструкции отсутствуют.' },
  { title: 'Синтетические наркотики', vendor: 'northchem', price: '0.044 XMR', category: 'DRUGS', rating: '4.1 / 5', note: 'Вымышленный товар. Состав, дозировки и доставка не показываются.' },
  { title: 'Принудительный труд / перевозка людей', vendor: 'redharbor', price: 'PRIVATE', category: 'TRAFFICKING', rating: 'DISPUTED', note: 'Тяжёлый сюжетный раздел. Без изображений, сексуального контента и инструкций.' },
  { title: 'Архив корпоративной переписки', vendor: 'paperghost', price: '0.009 XMR', category: 'DATA', rating: '4.8 / 5', note: 'Синтетические записи внутри игрового мира.' },
];

export const darknetMessages = [
  {
    id: 'unknown-01',
    from: '0000000000000000',
    subject: 'работа',
    time: '03:14 UTC',
    body: 'Ты закрыл BLACKPOST. Нужен человек, который умеет сводить события с разных систем. Есть сеть, три узла и активный противник. 18 000 после результата. Всё в копии. Ответ до утра.',
  },
];
