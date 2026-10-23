export function initPostTitleHeight(root, selector = '.swiper') {
    const destroyGridHeights = initGridTitleHeight(root);
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

    return destroyGridHeights;
}

function initGridTitleHeight(root) {
    const grids = [...root.querySelectorAll('.grid.grid-3')].filter((grid) =>
        grid.querySelector('.post-item h4'),
    );
    if (!grids.length) return;

    const view = root.defaultView;
    let destroyed = false;
    const reset = (titles) => titles.forEach((title) => title.style.removeProperty('min-height'));
    const update = () => {
        if (destroyed) return;
        const columns = view.innerWidth <= 767 ? 1 : view.innerWidth <= 1024 ? 2 : 3;

        grids.forEach((grid) => {
            const titles = [...grid.querySelectorAll('.post-item h4')];
            reset(titles);
            if (columns === 1) return;

            // Measure natural heights before applying a minimum to each row.
            const heights = titles.map((title) => title.getBoundingClientRect().height);
            for (let index = 0; index < titles.length; index += columns) {
                const height = Math.ceil(Math.max(...heights.slice(index, index + columns)));
                titles.slice(index, index + columns).forEach((title) => {
                    title.style.minHeight = `${height}px`;
                });
            }
        });
    };

    const observer = new ResizeObserver(update);
    grids.forEach((grid) => observer.observe(grid));
    view.addEventListener('resize', update);
    root.fonts.ready.then(update);
    update();

    return () => {
        destroyed = true;
        observer.disconnect();
        view.removeEventListener('resize', update);
        grids.forEach((grid) => reset([...grid.querySelectorAll('.post-item h4')]));
    };
}
