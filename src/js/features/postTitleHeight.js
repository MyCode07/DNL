export function initPostTitleHeight(root, selector = '.swiper') {
    const sliders = root.querySelectorAll(selector);
    if (!sliders) return;

    sliders.forEach((slider) => {
        const titles = [...slider.querySelectorAll('.post-item h4')];

        if (!titles.length) return;

        const update = () => {
            slider.style.removeProperty('--title-height');

            const maxHeight = Math.max(
                ...titles.map((title) => title.getBoundingClientRect().height),
            );

            slider.style.setProperty('--title-height', Math.ceil(maxHeight));
        };

        const observer = new ResizeObserver(update);

        titles.forEach((title) => observer.observe(title));

        root.fonts.ready.then(update);
        update();
    });
}
