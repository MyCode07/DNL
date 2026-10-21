/** Thresholds preserve row direction while adding a small variation between cells. */
export function createPixelCells(columns, rows, direction, random = Math.random) {
    const rowDelay = 0.16;
    const variation = 0.42;
    const maximum = (rows - 1) * rowDelay + variation;
    const cells = [];
    for (let row = 0; row < rows; row++) {
        const directionalRow = direction === 'down' ? rows - 1 - row : row;
        for (let column = 0; column < columns; column++) {
            cells.push({
                row,
                column,
                threshold: (directionalRow * rowDelay + random() * variation) / maximum,
            });
        }
    }
    return cells;
}
