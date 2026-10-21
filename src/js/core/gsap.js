import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);
// Lenis and ScrollTrigger use the same clock without ticker lag correction.
gsap.ticker.lagSmoothing(0);

export { gsap, ScrollTrigger };
