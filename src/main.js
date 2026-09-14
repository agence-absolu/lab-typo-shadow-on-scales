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
const inners = section.querySelectorAll('.row-inner');

// Une seule « ombre » monte l'escalier : toutes les rangées parcourent la même
// distance absolue, celle qu'il faut à la plus profonde pour sortir entièrement
// (plus une ligne de marge pour les jambages).
const travel = () => {
  const deepest = Math.max(...[...inners].map((el) => el.offsetHeight));
  return -(deepest + parseFloat(getComputedStyle(scales).fontSize));
};

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: section,
    start: () => 'top bottom-=' + section.offsetHeight,
    end: '+=100%',
    pin: true,
    scrub: true,
    invalidateOnRefresh: true, // recalcule start et travel() au resize
    markers: false,
  },
});

tl.to(inners, { y: travel, ease: 'none' }, 0);

// Inter arrive en @import : la hauteur des rangées peut changer après coup.
document.fonts.ready.then(() => ScrollTrigger.refresh());
