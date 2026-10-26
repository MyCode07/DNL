import { createScope } from '../core/lifecycle.js';

const LIFETIME = 60 * 60 * 24 * 30;

function readCookie(root, name) {
    const prefix = `${encodeURIComponent(name)}=`;
    try {
        const entry = root.cookie
            .split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith(prefix));
        return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
    } catch {
        return null;
    }
}

function writeCookie(root, name, value) {
    try {
        const secure = root.defaultView.location.protocol === 'https:' ? '; Secure' : '';
        root.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${LIFETIME}; Path=/; SameSite=Lax${secure}`;
        return readCookie(root, name) === value;
    } catch {
        return false;
    }
}

export function initCookies(root) {
    const scope = createScope();
    const banner = root.querySelector('.cookies');
    const accept = banner?.querySelector('[data-accept-cookies]');
    const inputs = [...root.querySelectorAll('input[type="checkbox"][name*="cookie" i]')];
    const states = new WeakMap();
    const editable = (input) => !input.matches(':disabled') && !input.readOnly;
    const errors = new Map();
    const showError = (target) => {
        if (!errors.has(target)) {
            const message = root.createElement('p');
            message.setAttribute('role', 'status');
            message.className = 'text-s';
            message.textContent = root.documentElement.lang.startsWith('ru')
                ? 'Не удалось сохранить настройки cookie. Проверьте настройки браузера и попробуйте ещё раз.'
                : 'Could not save cookie settings. Check your browser settings and try again.';
            target.append(message);
            errors.set(target, message);
        }
        errors.get(target).hidden = false;
    };
    const clearError = (target) => {
        if (errors.has(target)) errors.get(target).hidden = true;
    };
    const syncBanner = () => {
        if (!banner) return;
        const hidden = readCookie(root, 'cookie') === '1';
        banner.classList.toggle('_hide', hidden);
        banner.inert = hidden;
        banner.setAttribute('aria-hidden', String(hidden));
    };

    syncBanner();
    if (accept)
        scope.on(accept, 'click', () => {
            if (writeCookie(root, 'cookie', '1')) {
                clearError(banner);
                syncBanner();
            } else showError(banner);
        });

    for (const input of inputs) {
        if (!editable(input)) continue;
        const saved = readCookie(root, input.name);
        if (saved === '0' || saved === '1') input.checked = saved === '1';
        else if (input.dataset.cookieDefaultChecked !== undefined) {
            // Cached HTML can contain another visitor's server-rendered preference.
            input.checked = input.dataset.cookieDefaultChecked === '1';
        }
        states.set(input, input.checked);
        scope.on(input, 'change', () => {
            if (!editable(input)) return;
            const target = input.closest('.cookies-checkbox') || input.parentElement;
            if (!writeCookie(root, input.name, input.checked ? '1' : '0')) {
                input.checked = states.get(input);
                showError(target);
                return;
            }
            clearError(target);
            for (const peer of inputs) {
                if (peer.name !== input.name || !editable(peer)) continue;
                peer.checked = input.checked;
                states.set(peer, peer.checked);
            }
            syncBanner();
        });
    }
    scope.add(() => errors.forEach((message) => message.remove()));
    return scope.destroy;
}
