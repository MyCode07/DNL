# Typography

`_tokens.scss` is the source of truth for the 18 existing typography styles. `base`
contains desktop declarations; keys `1440` and `767` contain only changes
at those inclusive maximum widths. Properties inherit independently from the
preceding breakpoint. The existing 2560px root font-size override still scales
all rem values.

`_mixins.scss` resolves changes and provides two public mixins. `_index.scss`
exports the data and mixins without generating CSS. `../font-processing` remains
a compatible module entry point.

## HTML

All existing names, including `h1`–`h4` element selectors, are preserved:

```html
<h2 class="h2">Heading</h2>
<p class="body-text">Body copy</p>
<span class="text-m">Caption</span>
```

`base/_global.scss` calls `generate()` exactly once at the original typography
position in the cascade, without arguments. Body text, article captions and table
cells apply existing styles locally with `type.typography()`. Equal declaration maps share
selectors; each breakpoint produces one media query. Do not call `generate()` in
components.

## SCSS selectors

```scss
@use '../typography' as type;

.article-title {
    @include type.typography('h3');
}

.upload-button {
    font: inherit;
    @include type.typography('primary-button', $properties: (line-height));
}
```

The optional property list restricts both base and responsive output. A missing
style name fails compilation. Importing this module alone emits no CSS.

## Editing a style

Edit its map in `_tokens.scss`. Any CSS property can be responsive, including
`font-weight`, `font-family`, `text-transform`, or `font-style`. For example:

```scss
"example": (
    base: (font-size: 2rem, line-height: 2.4rem, font-weight: 400),
    1280: (line-height: 2.2rem),
    1024: (font-weight: 500),
    767: (font-size: 1.6rem),
),
```

The class `.example` is generated automatically. Add an entry to `$selectors`
only when a style also needs element selectors. To apply a style to component
selectors, use `type.typography()` inside those selectors. Keep breakpoint order
from larger to smaller widths. To reset a property, use a CSS value such as
`normal`, `inherit`, or `unset`; null values produce no declaration.

Typography values and breakpoints are maintained in `_tokens.scss` without a
fixed test snapshot. The Vite build checks SCSS compilation; validate typography
visually at the project's responsive widths after design changes.
