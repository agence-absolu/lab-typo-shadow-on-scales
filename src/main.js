import 'modern-normalize/modern-normalize.css';
import 'lenis/dist/lenis.css';
import './style.scss';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Défilement lissé par Lenis, piloté par le ticker GSAP pour rester
// synchronisé avec ScrollTrigger (recommandation GSAP).
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

export { gsap, ScrollTrigger, SplitText, lenis };
