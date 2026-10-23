import { createScope } from '../core/lifecycle.js';
import {
    getFormFields,
    getBudgetFields,
    getFieldContainer,
    isFieldValid,
    getFieldErrorMessage,
} from '../utils/form-validation.js';

/** CF7 owns transport; this module owns validation and result presentation. */
export function initContactForms(root) {
    const scope = createScope();
    for (const form of root.querySelectorAll('.wpcf7 form')) {
        const wrapper = form.closest('.wpcf7');
        const popup = form.closest('.popup');
        const budget = getBudgetFields(form);
        const buttons = [
            ...form.querySelectorAll(
                'button:not([type]), button[type="submit"], input[type="submit"]',
            ),
        ];
        const originalDisabled = buttons.map((button) => button.disabled);
        const touched = new Set();
        const serverErrors = new Set();
        let pending = false;
        let disposed = false;

        function update() {
            if (disposed) return false;
            const fields = getFormFields(form);
            const containers = new Map();
            let valid = true;
            for (const field of fields) {
                const invalid =
                    serverErrors.has(field.name) || !isFieldValid(field, fields, budget);
                valid &&= !invalid;
                const container = getFieldContainer(field);
                const showError = touched.has(field) && invalid;
                containers.set(container, containers.get(container) || showError);
                if (touched.has(field)) field.setAttribute('aria-invalid', String(invalid));
            }
            const message = getFieldErrorMessage(root.documentElement.lang);
            for (const [container, error] of containers) {
                container?.classList.toggle('error', error);
                if (!container) continue;
                const tips = [...container.querySelectorAll('.wpcf7-not-valid-tip')];
                if (error) {
                    if (tips.some((tip) => !tip.hasAttribute('data-contact-form-error'))) {
                        tips.filter((tip) => tip.hasAttribute('data-contact-form-error')).forEach(
                            (tip) => tip.remove(),
                        );
                    }
                    if (!tips.length) {
                        const tip = root.createElement('span');
                        tip.className = 'wpcf7-not-valid-tip';
                        tip.dataset.contactFormError = '';
                        tip.setAttribute('role', 'status');
                        container.append(tip);
                        tips.push(tip);
                    }
                    tips.forEach((tip) => {
                        tip.textContent = message;
                    });
                } else {
                    tips.filter((tip) => tip.hasAttribute('data-contact-form-error')).forEach(
                        (tip) => tip.remove(),
                    );
                }
            }
            for (const item of wrapper.querySelectorAll('.screen-reader-response li')) {
                (item.querySelector('a') || item).textContent = message;
            }
            const busy = pending || ['submitting', 'resetting'].includes(form.dataset.status);
            buttons.forEach((button) => {
                button.disabled = !valid || busy;
            });
            return valid;
        }

        function showResult(result) {
            if (disposed) return;
            if (popup) {
                if (popup.classList.contains('_open'))
                    popup.dispatchEvent(new CustomEvent('popup:result', { detail: result }));
                return;
            }
            const target = root.getElementById('contact-form-result');
            if (!target) return;
            target.dispatchEvent(
                new CustomEvent('popup:request-open', {
                    bubbles: true,
                    detail: { trigger: getFormFields(form)[0] || buttons[0] || form, result, form },
                }),
            );
        }

        function clearFieldError(field) {
            serverErrors.delete(field.name);
            const wrap = field.closest('.wpcf7-form-control-wrap');
            const controls = wrap
                ? wrap.querySelectorAll('input, textarea, select, .wpcf7-form-control')
                : [field];
            wrap?.querySelectorAll('.wpcf7-not-valid-tip').forEach((tip) => tip.remove());
            controls.forEach((control) => {
                const errorId = control.getAttribute('aria-describedby');
                const message = errorId && root.getElementById(errorId);
                if (message && wrapper.contains(message)) message.remove();
                control.removeAttribute('aria-describedby');
                control.classList.remove('wpcf7-not-valid');
                control.setCustomValidity?.('');
            });
        }

        function changed(event) {
            const field = event.target;
            if (!getFormFields(form).includes(field)) return;
            touched.add(field);
            clearFieldError(field);
            if (budget && budget.radios.includes(field) && field.checked) {
                budget.custom.value = '';
                touched.add(budget.custom);
                clearFieldError(budget.custom);
            } else if (budget && field === budget.custom && field.value.length) {
                budget.radios.forEach((radio) => {
                    radio.checked = false;
                    touched.add(radio);
                });
                clearFieldError(budget.radios[0]);
            }
            update();
            // CF7 may update its own submit controls later in the same change event.
            queueMicrotask(update);
        }
        scope.on(form, 'input', changed);
        scope.on(form, 'change', changed);
        scope.on(
            form,
            'submit',
            (event) => {
                const fields = getFormFields(form);
                fields.forEach((field) => touched.add(field));
                if (!update() || pending) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    fields.find((field) => !isFieldValid(field, fields, budget))?.focus();
                    return;
                }
                if (!window.wpcf7?.submit) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                pending = true;
                update();
                Promise.resolve()
                    .then(() => window.wpcf7.submit(form, { submitter: event.submitter }))
                    .catch((error) => {
                        // Preserve CF7's diagnostics for rejected transport requests.
                        // eslint-disable-next-line no-console
                        console.error('Contact Form 7 submission failed', error);
                        // CF7 leaves the form in submitting state when the request rejects.
                        if (form.dataset.status === 'submitting') {
                            form.classList.replace('submitting', 'init');
                            form.dataset.status = 'init';
                            if (form.wpcf7) form.wpcf7.status = 'init';
                        }
                        showResult('error');
                    })
                    .finally(() => {
                        pending = false;
                        update();
                    });
            },
            { capture: true },
        );
        scope.on(wrapper, 'wpcf7mailsent', () => showResult('success'));
        for (const type of ['wpcf7mailfailed', 'wpcf7spam', 'wpcf7aborted'])
            scope.on(wrapper, type, () => showResult('error'));
        for (const type of ['wpcf7invalid', 'wpcf7unaccepted']) {
            scope.on(wrapper, type, (event) => {
                for (const item of event.detail.apiResponse?.invalid_fields || [])
                    serverErrors.add(item.field);
                getFormFields(form).forEach((field) => touched.add(field));
                update();
                queueMicrotask(() => {
                    update();
                    getFormFields(form)
                        .find((field) => serverErrors.has(field.name))
                        ?.focus();
                });
            });
        }
        scope.on(form, 'reset', () => {
            touched.clear();
            serverErrors.clear();
            queueMicrotask(() => {
                if (disposed) return;
                getFormFields(form).forEach((field) => field.setAttribute('aria-invalid', 'false'));
                update();
            });
        });
        scope.on(wrapper, 'wpcf7statuschanged', () => queueMicrotask(update));
        scope.on(wrapper, 'wpcf7reset', update);
        if (popup) {
            scope.on(popup, 'popup:open', update);
            scope.on(popup, 'popup:retry', update);
        }
        scope.on(root.defaultView || window, 'pageshow', update);
        update();
        scope.add(() => {
            disposed = true;
            form.querySelectorAll('[data-contact-form-error]').forEach((tip) => tip.remove());
            buttons.forEach((button, index) => {
                button.disabled = originalDisabled[index];
            });
            getFormFields(form).forEach((field) => {
                getFieldContainer(field)?.classList.remove('error');
                field.setAttribute('aria-invalid', 'false');
            });
        });
    }
    return scope.destroy;
}
