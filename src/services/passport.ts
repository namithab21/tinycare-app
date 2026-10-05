import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { VACCINE_BY_ID } from '@/data/vaccines';
import type { Dict } from '@/i18n/translations';
import type { Child, DataState } from '@/types';
import { ageLabel, formatDate } from '@/utils';
import { vaccineStatus } from './health';

function esc(s: string | number | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPassportHtml(child: Child, state: DataState, t: Dict): string {
  const lang = state.settings.language;
  const growth = state.growth
    .filter((g) => g.childId === child.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const vacc = state.vaccinations
    .filter((v) => v.childId === child.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const growthRows = growth
    .map(
      (g) =>
        `<tr><td>${esc(formatDate(g.date, lang))}</td><td>${esc(g.weightKg)}</td><td>${esc(g.heightCm)}</td><td>${esc(g.headCm ?? '—')}</td></tr>`,
    )
    .join('');

  const vaccRows = vacc
    .map((v) => {
      const vaccine = VACCINE_BY_ID[v.vaccineId];
      const status = vaccineStatus(v);
      const label = t[status];
      const when = v.administeredDate
        ? t.givenOn.replace('{date}', formatDate(v.administeredDate, lang))
        : t.dueOn.replace('{date}', formatDate(v.dueDate, lang));
      return `<tr><td>${esc(vaccine?.name ?? v.vaccineId)}</td><td>${esc(when)}</td><td class="${status}">${esc(label)}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color:#16302A; padding:24px; }
  h1 { color:#2F9E7A; margin:0 0 4px; }
  h2 { border-bottom:2px solid #DDF3EA; padding-bottom:4px; margin-top:28px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { text-align:left; padding:6px 8px; border-bottom:1px solid #DDEBE3; }
  th { background:#F3FAF6; }
  .completed { color:#2F9E7A; font-weight:600; }
  .overdue { color:#C62440; font-weight:600; }
  .pending { color:#C77700; font-weight:600; }
  .meta { color:#5B746B; font-size:13px; }
  .foot { margin-top:32px; color:#5B746B; font-size:11px; }
</style></head>
<body>
  <h1>TinyCare — ${esc(t.passport)}</h1>
  <p class="meta">${esc(child.name)} · ${esc(formatDate(child.dob, lang))} · ${esc(ageLabel(child.dob))}${
    child.birthWeightKg ? ` · ${esc(t.birthWeight)}: ${esc(child.birthWeightKg)}` : ''
  }</p>
  <h2>${esc(t.vaccines)}</h2>
  <table><tr><th>${esc(t.vaccines)}</th><th>${esc(t.dueOn.replace('{date}', '').trim() || 'Date')}</th><th></th></tr>${vaccRows}</table>
  <h2>${esc(t.growth)}</h2>
  ${
    growth.length
      ? `<table><tr><th></th><th>${esc(t.weightKg)}</th><th>${esc(t.heightCm)}</th><th>${esc(t.headCm)}</th></tr>${growthRows}</table>`
      : `<p class="meta">${esc(t.noGrowth)}</p>`
  }
  <p class="foot">${esc(t.disclaimer)}</p>
</body></html>`;
}

export async function sharePassport(child: Child, state: DataState, t: Dict): Promise<boolean> {
  const html = buildPassportHtml(child, state, t);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return true;
  }
  return false;
}
