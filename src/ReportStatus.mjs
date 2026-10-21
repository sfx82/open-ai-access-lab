import { createElement as h } from 'react';

export function ReportStatus({status}) {
  if (status === 'loading') return h('p', {role:'status'}, 'Loading published benchmarks...');
  if (status === 'error') return h('p', {role:'alert'}, 'Published reports could not be validated. No comparison displayed.');
  if (status === 'empty') return h('section', {className:'results'},
    h('div', {className:'empty'},
      h('h3', null, 'No verified benchmarks published yet.'),
      h('p', null, 'No reviewed reports are listed in the public index. Preliminary observations and synthetic scores are excluded.')));
  return null;
}
