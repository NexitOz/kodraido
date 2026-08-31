from pathlib import Path

path = Path('index.html')
s = path.read_text(encoding='utf-8')

def replace_once(old, new, label):
    global s
    count = s.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 occurrence, found {count}')
    s = s.replace(old, new, 1)

replace_once(
    '''      <div class="eyebrow" id="presaveSecondaryEyebrow">✨ ещё один пресейв открыт</div>
      <h2><span id="presaveSecondaryTitle">Блю Лок —</span><br><span class="accent" id="presaveSecondaryAccent">Эго.</span></h2>
      <p class="lede" id="presaveSecondaryDesc">Открой пресейв — трек появится в твоей библиотеке сразу после релиза.</p>''',
    '''      <div class="eyebrow" id="presaveSecondaryEyebrow">✨ ещё один пресейв открыт</div>
      <h2><span id="presaveSecondaryTitle">11 масок</span><br><span class="accent" id="presaveSecondaryAccent">Пресейв открыт.</span></h2>
      <p class="lede" id="presaveSecondaryDesc">Открой пресейв — трек появится в твоей библиотеке сразу после релиза.</p>''',
    'static presave heading'
)
replace_once(
    '<img id="presaveSecondaryCoverImage" src="/images/blue-lock-ego-cover.png" alt="Обложка «Блю Лок — Эго»">',
    '<img id="presaveSecondaryCoverImage" src="/images/11-masok-cover.png" alt="Обложка «11 масок»">',
    'static presave cover'
)
replace_once(
    '<a class="btn-solid presave-btn" id="presaveSecondaryBtn" href="https://band.link/ue2IB" target="_blank" rel="noopener">',
    '<a class="btn-solid presave-btn" id="presaveSecondaryBtn" href="https://band.link/2WeFa" target="_blank" rel="noopener">',
    'static presave link'
)

replace_once(
    '''    featuredRelease: {
      badge:'Сингл', title:'Повелитель тайн',
      description:'Новый сингл КОД РАЙДО уже доступен на музыкальных площадках.',
      cover:'/images/povelitel-tayn-cover.png',
      cta:'Слушать сейчас', href:'https://creatormusic.ru/release/kod-raydo-povelitel-tayn'
    },''',
    '''    featuredRelease: {
      badge:'Сингл', title:'Блю Лок — Эго',
      description:'Сингл КОД РАЙДО уже доступен на музыкальных площадках.',
      cover:'/images/blue-lock-ego-cover.png',
      cta:'Слушать сейчас', href:'https://band.link/ue2IB'
    },''',
    'fallback featured release'
)

replace_once(
    '''    presaveSecondary: {
      eyebrow:'✨ ещё один пресейв открыт', title:'Блю Лок —', accent:'Эго.',
      description:'Открой пресейв — трек появится в твоей библиотеке сразу после релиза.',
      cover:'/images/blue-lock-ego-cover.png', cta:'Открыть пресейв', href:'https://band.link/ue2IB'
    },''',
    '''    presaveSecondary: {
      eyebrow:'✨ ещё один пресейв открыт', title:'11 масок', accent:'Пресейв открыт.',
      description:'Открой пресейв — трек появится в твоей библиотеке сразу после релиза.',
      cover:'/images/11-masok-cover.png', cta:'Открыть пресейв', href:'https://band.link/2WeFa'
    },''',
    'fallback secondary presave'
)

replace_once(
    '<p>Пять новых историй уже доступны на музыкальных площадках.</p>',
    '<p>Шесть новых историй уже доступны на музыкальных площадках.</p>',
    'new tracks count'
)
marker = '''    <div class="track-scroll">
      <a class="track-card" href="https://creatormusic.ru/release/kod-raydo-pozhiratel-zvezd" target="_blank" rel="noopener"><img src="/images/pozhiratel-zvezd-cover.png" alt="Обложка трека «Пожиратель звёзд»"><div class="tnum">01 · НОВОЕ</div><div class="ttitle">Пожиратель звёзд</div></a>'''
replacement = '''    <div class="track-scroll">
      <a class="track-card" href="https://creatormusic.ru/release/kod-raydo-povelitel-tayn" target="_blank" rel="noopener"><img src="/images/povelitel-tayn-cover.png" alt="Обложка трека «Повелитель тайн»"><div class="tnum">01 · НОВОЕ</div><div class="ttitle">Повелитель тайн</div></a>
      <a class="track-card" href="https://creatormusic.ru/release/kod-raydo-pozhiratel-zvezd" target="_blank" rel="noopener"><img src="/images/pozhiratel-zvezd-cover.png" alt="Обложка трека «Пожиратель звёзд»"><div class="tnum">02 · НОВОЕ</div><div class="ttitle">Пожиратель звёзд</div></a>'''
replace_once(marker, replacement, 'insert Povelitel card')
replace_once('<div class="tnum">02 · НОВОЕ</div><div class="ttitle">Ли Мувань</div>', '<div class="tnum">03 · НОВОЕ</div><div class="ttitle">Ли Мувань</div>', 'renumber Li Muvan')
replace_once('<div class="tnum">03 · НОВОЕ</div><div class="ttitle">Меч и жезл Вистории</div>', '<div class="tnum">04 · НОВОЕ</div><div class="ttitle">Меч и жезл Вистории</div>', 'renumber Vistoria')
replace_once('<div class="tnum">04 · НОВОЕ</div><div class="ttitle">Любимый во Франксе</div>', '<div class="tnum">05 · НОВОЕ</div><div class="ttitle">Любимый во Франксе</div>', 'renumber Franxx')
replace_once('<div class="tnum">05 · НОВОЕ</div><div class="ttitle">Ангел кровопролития</div>', '<div class="tnum">06 · НОВОЕ</div><div class="ttitle">Ангел кровопролития</div>', 'renumber Angel')

path.write_text(s, encoding='utf-8')

required = [
    'id="presaveSecondaryTitle">11 масок',
    '/images/11-masok-cover.png',
    'https://band.link/2WeFa',
    "title:'Блю Лок — Эго'",
    'Шесть новых историй уже доступны',
    'kod-raydo-povelitel-tayn',
    '>06 · НОВОЕ</div><div class="ttitle">Ангел кровопролития</div>',
]
for needle in required:
    if needle not in s:
        raise SystemExit(f'missing expected HTML marker: {needle}')

catalog = s.split('<section class="bleed" id="catalog"', 1)[1].split('</section>', 1)[0]
if catalog.count('class="track-card"') != 6:
    raise SystemExit(f'expected exactly six track cards, got {catalog.count("class=\"track-card\"")}')
