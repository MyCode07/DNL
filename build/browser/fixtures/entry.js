import { initApp } from '../../../src/js/app.js';

// Exercise the real application lifecycle, including sliders, scrolling and corners.
window.mountComponents = () => {
    window.destroyComponents = initApp();
};
window.mountComponents();
