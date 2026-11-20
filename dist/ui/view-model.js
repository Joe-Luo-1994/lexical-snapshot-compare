export function focusedRows(rows) {
    const keep = new Set([0]);
    rows.forEach((r, i) => {
        if (r.status !== "same")
            for (let j = Math.max(0, i - 1); j <= Math.min(rows.length - 1, i + 1); j++)
                keep.add(j);
    });
    const out = [];
    let hidden = 0;
    for (let i = 0; i < rows.length; i++) {
        if (!keep.has(i)) {
            hidden++;
            continue;
        }
        if (hidden) {
            out.push({ gap: hidden });
            hidden = 0;
        }
        out.push(rows[i]);
    }
    if (hidden)
        out.push({ gap: hidden });
    return out;
}
