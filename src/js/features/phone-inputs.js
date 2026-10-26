import intlTelInput from 'intl-tel-input';
import ru from 'intl-tel-input/locale/ru';
import { createScope } from '../core/lifecycle.js';
import { registerPhoneValidator } from '../utils/form-validation.js';

const COUNTRY_KEY = 'frame:phone-country';
const countries = new Set(intlTelInput.getAllCountries().map((country) => country.iso2));

export function initialPhoneCountry(languages, saved) {
    if (countries.has(saved)) return saved;
    for (const language of languages) {
        try {
            const region = new Intl.Locale(language).region?.toLowerCase();
            if (countries.has(region)) return region;
        } catch {
            /* An invalid browser locale is not a country hint. */
        }
    }
    return '';
}

export function initPhoneInputs(form, onReady) {
    const scope = createScope();
    const root = form.ownerDocument;
    const view = root.defaultView;
    const entries = [];
    let disposed = false;
    let saved;
    try {
        saved = view.localStorage.getItem(COUNTRY_KEY);
    } catch {
        /* Remembering a country is optional. */
    }
    const initialCountry = initialPhoneCountry(
        view.navigator.languages || [view.navigator.language],
        saved,
    );
    const russian = /^ru(?:-|$)/i.test(root.documentElement.lang);

    for (const field of form.querySelectorAll(
        'input[type="tel"], input[type="text"][name="phone"]',
    )) {
        if (field.disabled || field.closest('.novalidate') || field.name.includes('honeypot'))
            continue;
        const originalMaxLength = field.getAttribute('maxlength');
        const originalType = field.getAttribute('type');
        field.type = 'tel';
        // Old CF7 tags can contain a national-number length, which would truncate international input.
        field.removeAttribute('maxlength');
        const instance = intlTelInput(field, {
            initialCountry,
            countryNameLocale: russian ? 'ru' : 'en',
            ...(russian ? { uiTranslations: ru } : {}),
            countrySelectorMode: 'DROPDOWN',
            dropdownParent: field.closest('.popup') || root.body,
            searchInputClass: 'novalidate',
            numberDisplayFormat: 'INTERNATIONAL',
            allowedNumberTypes: ['MOBILE', 'FIXED_LINE'],
            loadUtils: () => import('intl-tel-input/utils'),
        });
        const state = { field, instance, ready: false, failed: false };
        entries.push(state);
        scope.add(
            registerPhoneValidator(field, () => {
                if (state.failed)
                    return /^\+[1-9]\d{6,14}$/.test(field.value.replace(/[\s().-]/g, ''));
                return state.ready && instance.isValidNumber() === true;
            }),
        );
        instance.promise
            .then(() => {
                if (disposed) return;
                state.ready = true;
                onReady();
            })
            .catch((error) => {
                if (disposed) return;
                state.failed = true;
                // Leave an ordinary tel field usable if the optional formatting chunk fails.
                instance.destroy();
                field.type = 'tel';
                field.removeAttribute('maxlength');
                const message = root.createElement('p');
                message.className = 'text-s';
                message.setAttribute('role', 'status');
                message.textContent = russian
                    ? 'Форматирование телефона недоступно. Введите номер с международным кодом, начиная с +.'
                    : 'Phone formatting is unavailable. Enter an international number starting with +.';
                field.closest('.form__item')?.append(message);
                scope.add(() => message.remove());
                // eslint-disable-next-line no-console
                console.error('Phone formatting could not be loaded', error);
                onReady();
            });
        scope.on(field, 'countrychange', () => {
            const selected = instance.getSelectedCountry();
            if (selected) {
                try {
                    view.localStorage.setItem(COUNTRY_KEY, selected.iso2);
                } catch {
                    /* Storage is optional. */
                }
            }
        });
        scope.add(() => {
            if (!state.failed) instance.destroy();
            if (originalType === null) field.removeAttribute('type');
            else field.setAttribute('type', originalType);
            if (originalMaxLength === null) field.removeAttribute('maxlength');
            else field.setAttribute('maxlength', originalMaxLength);
        });
    }
    scope.on(form, 'formdata', (event) => {
        for (const { field, instance, ready, failed } of entries) {
            if (!field.name || field.disabled || !field.value.trim()) continue;
            if (ready && instance.isValidNumber())
                event.formData.set(field.name, instance.getNumber());
            else if (failed) event.formData.set(field.name, field.value.replace(/[\s().-]/g, ''));
        }
    });
    scope.on(form, 'reset', () =>
        queueMicrotask(() => {
            if (disposed) return;
            entries.forEach(({ instance, field, failed }) => {
                if (!failed) instance.setNumber(field.value);
            });
            onReady();
        }),
    );
    scope.add(() => {
        disposed = true;
    });
    return scope.destroy;
}
