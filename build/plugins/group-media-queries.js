/** Merge adjacent media queries without moving rules across the cascade. */
export function groupMediaQueriesPlugin() {
    return {
        postcssPlugin: 'group-media-queries',
        Once(root) {
            root.walkAtRules('media', (rule) => {
                const previous = rule.prev();
                if (
                    previous?.type !== 'atrule' ||
                    previous.name !== 'media' ||
                    previous.params !== rule.params
                )
                    return;
                previous.append(rule.nodes);
                rule.remove();
            });
        },
    };
}
