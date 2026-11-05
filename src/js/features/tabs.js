import { createScope } from '../core/lifecycle.js';
import { ScrollTrigger } from '../core/gsap.js';

/** Each tab area owns its selection; hidden Swipers are updated after becoming visible. */
export function initTabs(root) {
    const scope = createScope();
    for (const area of root.querySelectorAll('[data-tab-area]')) {
        const tabs = [...area.querySelectorAll('[data-tab]')].filter(
            (tab) => tab.closest('[data-tab-area]') === area,
        );
        const panels = [...area.querySelectorAll('[data-tab-content]')].filter(
            (panel) => panel.closest('[data-tab-area]') === area,
        );
        const snapshots = [...tabs, ...panels].map((element) => ({
            element,
            active: element.classList.contains('_active'),
            pressed: element.getAttribute('aria-pressed'),
            inert: element.inert,
        }));

        function select(id) {
            for (const tab of tabs) {
                const active = tab.dataset.tab === id;
                tab.classList.toggle('_active', active);
                tab.setAttribute('aria-pressed', String(active));
            }
            for (const panel of panels) {
                const active = panel.dataset.tabContent === id;
                panel.classList.toggle('_active', active);
                panel.inert = !active;
                if (active)
                    panel.querySelectorAll('.swiper').forEach((slider) => slider.swiper?.update());
            }
        }

        const active = tabs.find((tab) => tab.classList.contains('_active'));
        if (active) select(active.dataset.tab);
        scope.on(area, 'click', (event) => {
            if (!(event.target instanceof Element)) return;
            const tab = event.target.closest('[data-tab]');
            if (
                !tabs.includes(tab) ||
                !panels.some((panel) => panel.dataset.tabContent === tab.dataset.tab)
            )
                return;
            event.preventDefault();
            select(tab.dataset.tab);
            ScrollTrigger.refresh();
        });
        scope.add(() =>
            snapshots.forEach(({ element, active, pressed, inert }) => {
                element.classList.toggle('_active', active);
                element.inert = inert;
                if (pressed === null) element.removeAttribute('aria-pressed');
                else element.setAttribute('aria-pressed', pressed);
            }),
        );
    }
    return scope.destroy;
}
