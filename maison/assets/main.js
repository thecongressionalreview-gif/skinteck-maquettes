(() => {
  const toggle = document.querySelector('.toggle');
  const menu = document.querySelector('.menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('on', open);
    document.documentElement.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  const head = document.querySelector('.head');
  const bar = document.querySelector('.bar');
  const hero = document.querySelector('.hero');
  const onScroll = () => {
    const bottom = hero.getBoundingClientRect().bottom;
    const narrow = innerWidth <= 820;
    head.classList.toggle('solid', narrow ? scrollY > 40 : bottom < 90);
    bar.classList.toggle('on', scrollY > innerHeight * 0.5);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  const vid = document.querySelector('video[data-autoplay]');
  if (vid) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) vid.controls = true;
    else new IntersectionObserver(([e]) => {
      if (e.isIntersecting) vid.play().catch(() => { vid.controls = true; });
      else vid.pause();
    }, { threshold: 0.25 }).observe(vid);
  }
})();

(()=>{const t=document.createElement('div');t.className='maquette-toast';t.setAttribute('role','status');document.body.append(t);let h;document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.getAttribute('href')!=='#')return;e.preventDefault();t.textContent='Maquette : lien désactivé';t.classList.add('on');clearTimeout(h);h=setTimeout(()=>t.classList.remove('on'),1800)});})();
