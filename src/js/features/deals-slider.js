import { gsap } from '../core/gsap.js';
import { createScope } from '../core/lifecycle.js';
import { getDealsOffset } from '../utils/deals-layout.js';
import { cssTimeToSeconds } from '../utils/css-time.js';

/** Desktop cards keep fixed slots; smaller screens retain the scrolling track. */
export function initDealsSlider(section, media) {
    const track = section.querySelector('.deals-track');
    const viewport = section.querySelector('.deals-viewport');
    const slides = [...section.querySelectorAll('.deals-slide')];
    const images = [...section.querySelectorAll('.deals-media')];
    if (!track || !viewport || !slides.length) return;
    const scope = createScope();
    const context = gsap.context(() => {}, section);
    const prev = section.querySelector('.prev');
    const next = section.querySelector('.next');
    const progress = section.querySelector('.swiper-pagination-progressbar-fill');
    const elements = [
        track,
        viewport,
        ...slides,
        ...images,
        prev,
        next,
        progress,
        ...section.querySelectorAll('.deals-slide__layer'),
    ].filter(Boolean);
    const snapshots = elements.map((element) => [
        element,
        [...element.attributes].map(({ name, value }) => [name, value]),
    ]);
    let active = 0;
    let requested = 0;
    let offset = 0;
    let busy = false;
    let timeline;

    function activate(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            slide
                .querySelector('.deals-slide__layer--preview')
                ?.setAttribute('aria-hidden', String(i === index));
            slide
                .querySelector('.deals-slide__layer--detail')
                ?.setAttribute('aria-hidden', String(i !== index));
        });
    }

    function navigation() {
        [
            [prev, requested === 0],
            [next, requested === slides.length - 1],
        ].forEach(([button, disabled]) => {
            if (!button) return;
            button.disabled = disabled;
            button.classList.toggle('swiper-button-disabled', disabled);
        });
    }

    function layout(index, animate = true) {
        if (!media.mobile.matches) {
            track.style.setProperty('--deals-count', slides.length);
            track.classList.add('is-measuring');
            const height = Math.max(...slides.map((slide) => slide.offsetHeight));
            viewport.style.setProperty('--deals-cards-height', `${height}px`);
            if (animate) {
                track.classList.remove('is-measuring');
                void track.offsetWidth;
            }
            activate(index);
            offset = 0;
            track.style.transform = 'translate3d(0, 0, 0)';
            void track.offsetWidth;
            track.classList.remove('is-measuring');
            if (progress) progress.style.transform = `scaleX(${(index + 1) / slides.length})`;
            return;
        }
        // Measure the final CSS layout, then restore the start before allowing transitions.
        track.classList.add('is-measuring');
        activate(index);
        const slide = slides[index];
        // Cards use the track's content width; viewport padding is the outer gutter.
        const width = track.clientWidth;
        const end = slides.at(-1).offsetLeft + slides.at(-1).offsetWidth;
        const target = getDealsOffset(offset, slide.offsetLeft, slide.offsetWidth, width, end);
        if (animate) {
            activate(active);
            void track.offsetWidth;
            track.classList.remove('is-measuring');
            void track.offsetWidth;
        }
        activate(index);
        offset = target;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        if (!animate) {
            void track.offsetWidth;
            track.classList.remove('is-measuring');
        }
        if (progress) progress.style.transform = `scaleX(${(index + 1) / slides.length})`;
    }

    function showImage(index) {
        images.forEach((image, i) => {
            image.classList.toggle('active', i === index);
            gsap.set(image, {
                clipPath: i === index ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
                zIndex: i === index ? 2 : 0,
            });
            const inner = image.querySelector('.deals-media__inner');
            if (inner) gsap.set(inner, { yPercent: 0 });
        });
    }

    function request(index) {
        requested = Math.max(0, Math.min(slides.length - 1, index));
        navigation();
        if (busy || requested === active) return;
        const previous = active;
        const target = requested;
        const reduced = media.reducedMotion.matches;
        layout(target, !reduced);
        active = target;
        busy = !reduced;
        context.add(() => {
            if (reduced) {
                showImage(target);
                return;
            }
            const forward = target > previous;
            const outgoing = images[previous];
            const incoming = images[target];
            const duration = cssTimeToSeconds(
                getComputedStyle(section).getPropertyValue('--deals-duration'),
            );

            timeline = gsap.timeline({
                defaults: { duration, ease: 'power2.inOut' },
                onComplete() {
                    context.add(() => showImage(target));
                    busy = false;
                    request(requested);
                },
            });
            if (outgoing && incoming) {
                incoming.classList.add('active');
                gsap.set(incoming, {
                    zIndex: 3,
                    clipPath: forward ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
                });
                const inner = incoming.querySelector('.deals-media__inner');
                if (inner) gsap.set(inner, { yPercent: forward ? 10 : -10 });
                timeline.to(incoming, { clipPath: 'inset(0% 0% 0% 0%)' }, 0);
                if (inner) timeline.to(inner, { yPercent: 0 }, 0);
                timeline.to(
                    outgoing,
                    { clipPath: forward ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)' },
                    0,
                );
                const outgoingInner = outgoing.querySelector('.deals-media__inner');
                if (outgoingInner) timeline.to(outgoingInner, { yPercent: forward ? -10 : 10 }, 0);
            } else timeline.to({}, { duration });
        });
    }

    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Этапы выбора сделок');
    if (prev) scope.on(prev, 'click', () => request(requested - 1));
    if (next) scope.on(next, 'click', () => request(requested + 1));
    slides.forEach((slide, index) => {
        scope.on(slide, 'click', () => {
            if (index !== active) request(index);
        });
    });
    let layoutFrame = 0;
    const resize = new ResizeObserver(() => {
        if (layoutFrame) return;
        layoutFrame = requestAnimationFrame(() => {
            layoutFrame = 0;
            layout(active, false);
        });
    });
    resize.observe(viewport);
    slides.forEach((slide) => resize.observe(slide));
    scope.add(() => {
        resize.disconnect();
        cancelAnimationFrame(layoutFrame);
    });
    scope.on(media.mobile, 'change', () => layout(active, false));
    scope.on(media.reducedMotion, 'change', () => {
        if (media.reducedMotion.matches) timeline?.progress(1);
        layout(active, false);
    });
    context.add(() => showImage(0));
    layout(0, false);
    navigation();
    scope.add(() => {
        context.revert();
        snapshots.forEach(([element, attributes]) => {
            [...element.attributes].forEach(({ name }) => element.removeAttribute(name));
            attributes.forEach(([name, value]) => element.setAttribute(name, value));
        });
    });
    return scope.destroy;
}
