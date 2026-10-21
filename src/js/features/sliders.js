import Swiper from 'swiper';
import { A11y, Navigation, Pagination } from 'swiper/modules';
import { initDealsSlider } from './deals-slider.js';
import { createScope } from '../core/lifecycle.js';

export function initSliders(root, media) {
    const scope = createScope();
    for (const section of root.querySelectorAll('.deals')) {
        scope.add(initDealsSlider(section, media));
    }
    for (const slider of root.querySelectorAll('.swiper')) {
        const section = slider.closest('section');
        if (!section || slider.swiper) continue;
        const navigation = {
            prevEl: section.querySelector('.prev'),
            nextEl: section.querySelector('.next'),
        };
        let options;

        if (section.classList.contains('projects')) {
            options = {
                modules: [A11y, Pagination],
                pagination: { el: slider.querySelector('.swiper-pagination'), clickable: true },
                grabCursor: true,
                spaceBetween: 10,
                slidesPerView: 1,
            };
        } else if (section.classList.contains('publications')) {
            options = {
                modules: [A11y, Navigation],
                navigation,
                grabCursor: true,
                spaceBetween: 16,
                slidesPerView: 'auto',
            };
        } else continue;

        const swiper = new Swiper(slider, options);
        function updateMotion() {
            const breakpointSpeed = options.breakpoints?.[swiper.currentBreakpoint]?.speed;
            const speed = breakpointSpeed ?? options.speed ?? swiper.originalParams.speed;
            swiper.params.speed = media.reducedMotion.matches ? 0 : speed;
        }
        updateMotion();
        swiper.on('breakpoint', updateMotion);
        scope.on(media.reducedMotion, 'change', updateMotion);
        scope.add(() => {
            swiper.destroy(true, true);
        });
    }
    return scope.destroy;
}
