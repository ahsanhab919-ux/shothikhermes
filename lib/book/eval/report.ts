/**
 * Gate-baseline eval — pure markdown formatter (Phase R0).
 *
 * Turns a BaselineReport into a clean, copy-pasteable markdown block: an overall
 * line, a per-kind table, and a per-case table. Pure and deterministic — no I/O.
 */
import type { TwoSidedReport } from './harness';
import type { BaselineReport } from './types';

/** Format a 0..1 rate as a whole-ish percentage, e.g. 0.625 → "62.5%". */
function pct(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
}

/** Render the full baseline report as markdown. */
export function formatBaselineMarkdown(report: BaselineReport): string {
    const lines: string[] = [];

    lines.push('# Gate Drift-Catch Baseline');
    lines.push('');
    lines.push(
        `**Overall drift-catch rate: ${pct(report.catchRate)}** ` +
            `(${report.caught}/${report.total} known errors caught)`
    );
    lines.push('');

    lines.push('## Per kind');
    lines.push('');
    lines.push('| Kind | Caught | Total | Catch rate |');
    lines.push('| --- | ---: | ---: | ---: |');
    lines.push(
        `| non-fiction | ${report.perKind.nonfiction.caught} | ${report.perKind.nonfiction.total} | ${pct(
            report.perKind.nonfiction.catchRate
        )} |`
    );
    lines.push(
        `| fiction | ${report.perKind.fiction.caught} | ${report.perKind.fiction.total} | ${pct(
            report.perKind.fiction.catchRate
        )} |`
    );
    lines.push(`| **overall** | ${report.caught} | ${report.total} | ${pct(report.catchRate)} |`);
    lines.push('');

    lines.push('## Per case');
    lines.push('');
    lines.push('| Case | Kind | Expected error | Caught |');
    lines.push('| --- | --- | --- | :---: |');
    for (const c of report.perCase) {
        lines.push(
            `| ${c.id} | ${c.kind} | ${c.expectedErrorType} | ${c.caught ? '✅' : '❌'} |`
        );
    }
    lines.push('');

    return lines.join('\n');
}

/** Render a two-sided report (recall + false-positive rate + precision) as markdown. */
export function formatTwoSidedMarkdown(report: TwoSidedReport): string {
    const lines: string[] = [];

    lines.push('# Gate Two-Sided Eval');
    lines.push('');
    lines.push(
        `**Recall: ${pct(report.recall)}** (${report.caught}/${report.errorTotal} known errors caught) · ` +
            `**False-positive rate: ${pct(report.falsePositiveRate)}** ` +
            `(${report.falsePositives}/${report.cleanTotal} clean drafts wrongly rejected) · ` +
            `**Precision: ${pct(report.precision)}**`
    );
    lines.push('');

    lines.push('## Error cases (should be caught)');
    lines.push('');
    lines.push('| Case | Kind | Expected error | Caught |');
    lines.push('| --- | --- | --- | :---: |');
    for (const c of report.perError) {
        lines.push(`| ${c.id} | ${c.kind} | ${c.expectedErrorType} | ${c.caught ? '✅' : '❌'} |`);
    }
    lines.push('');

    lines.push('## Clean cases (should be accepted)');
    lines.push('');
    lines.push('| Case | Kind | Wrongly rejected |');
    lines.push('| --- | --- | :---: |');
    for (const c of report.perClean) {
        lines.push(`| ${c.id} | ${c.kind} | ${c.wronglyRejected ? '❌' : '✅'} |`);
    }
    lines.push('');

    return lines.join('\n');
}

export default { formatBaselineMarkdown, formatTwoSidedMarkdown };
