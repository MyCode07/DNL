import Swiper from 'swiper';
import { A11y, Autoplay, Navigation, Pagination } from 'swiper/modules';
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
                modules: [A11y, Pagination, Autoplay],
                pagination: { el: slider.querySelector('.swiper-pagination'), clickable: true },
                grabCursor: true,
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                },
                spaceBetween: 0,
                slidesPerView: 1,
            };
        } else if (section.classList.contains('why')) {
            options = {
                modules: [A11y, Navigation],
                navigation,
                grabCursor: true,
                spaceBetween: 16,
                breakpoints: {
                    0: {
                        slidesPerView: 'auto',
                    },
                    768: {
                        slidesPerView: 2,
                    },
                    1025: {
                        slidesPerView: 3,
                    },
                },
            };
        } else if (section.classList.contains('publications')) {
            options = {
                modules: [A11y, Navigation],
                navigation,
                grabCursor: true,
                spaceBetween: 16,
                breakpoints: {
                    0: {
                        slidesPerView: 'auto',
                    },
                    768: {
                        slidesPerView: 2,
                    },
                    1025: {
                        slidesPerView: 3,
                    },
                },
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
