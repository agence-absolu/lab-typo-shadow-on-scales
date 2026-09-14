import 'modern-normalize/modern-normalize.css';
import 'lenis/dist/lenis.css';
import './style.scss';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Défilement lissé par Lenis, piloté par le ticker GSAP pour rester
// synchronisé avec ScrollTrigger (recommandation GSAP).
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Les rangées de « scales » sont épinglées pendant que le texte monte les
// marches : la timeline est pilotée par le scroll (scrub).
const section = document.querySelector('section.content');
const scales = section.querySelector('.scales');
const container = scales.querySelector('.scales-container');
const rows = [...scales.querySelectorAll('.row')];
const inners = rows.map((row) => row.querySelector('.row-inner'));

// Géométrie de chaque rangée : matrice CSS (skew / scale), origine dans le
// repère de .scales, bande visible (overflow hidden) et rectangle local de
// l'encre du texte.
const measureRows = () => {
  const cm = new DOMMatrix(getComputedStyle(container).transform);
  const origin = { x: container.offsetLeft + cm.e, y: container.offsetTop + cm.f };

  return rows.map((row) => {
    const style = getComputedStyle(row);
    const inner = row.firstElementChild;
    const text = inner.firstElementChild;
    return {
      matrix: new DOMMatrix(style.transform),
      ox: origin.x + row.offsetLeft,
      oy: origin.y + row.offsetTop,
      band: row.offsetHeight,
      x0: parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
      y0: parseFloat(style.borderTopWidth) + parseFloat(getComputedStyle(inner).paddingTop),
      w: text.offsetWidth,
      h: text.offsetHeight,
    };
  });
};

// Une seule « ombre » monte l'escalier : toutes les rangées décalent leur
// texte de la même distance t. Reste-t-il de l'encre visible dans le cadre ?
// On échantillonne le rectangle de texte, borné à la bande de la rangée,
// et on projette chaque point.
const isVisible = (geometry, frame, t) =>
  geometry.some((g) => {
    const top = Math.max(0, g.y0 - t);
    const bottom = Math.min(g.band, g.y0 + g.h - t);
    if (bottom <= top) return false;
    for (let i = 0; i <= 24; i++) {
      for (let j = 0; j <= 8; j++) {
        const point = g.matrix.transformPoint(
          new DOMPoint(g.x0 + (g.w * i) / 24, top + ((bottom - top) * j) / 8),
        );
        const x = g.ox + point.x;
        const y = g.oy + point.y;
        if (x >= frame.left && x <= frame.right && y >= 0 && y <= frame.height) return true;
      }
    }
    return false;
  });

// Plus petit |t| dans la direction donnée à partir duquel le texte est hors cadre
const findExit = (geometry, frame, direction) => {
  const reach = geometry.at(-1).y0 + geometry.at(-1).h + frame.height;
  let visible = 0;
  let hidden = direction * reach;
  for (let i = 0; i < 40; i++) {
    const mid = (visible + hidden) / 2;
    if (isVisible(geometry, frame, mid)) visible = mid;
    else hidden = mid;
  }
  return hidden;
};

// Course du texte : de juste sous le cadre à juste au-dessus
const course = { from: 0, to: 0 };
const measure = () => {
  const geometry = measureRows();
  const left = -scales.getBoundingClientRect().left;
  const frame = { left, right: left + document.documentElement.clientWidth, height: scales.clientHeight };
  course.from = -findExit(geometry, frame, -1);
  course.to = -findExit(geometry, frame, 1);
};

measure();
ScrollTrigger.addEventListener('refreshInit', measure);

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: section,
    start: () => 'top bottom-=' + section.offsetHeight,
    end: '+=100%',
    pin: true,
    scrub: true,
    invalidateOnRefresh: true, // rejoue measure() et relit course au resize
    markers: false,
  },
});

tl.fromTo(inners, { y: () => course.from }, { y: () => course.to, ease: 'none' }, 0);

// Inter arrive en @import : la géométrie change une fois la police chargée.
document.fonts.ready.then(() => ScrollTrigger.refresh());
