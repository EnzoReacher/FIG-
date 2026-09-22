import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const currentStatePath = resolve(root, 'docs/CURRENT_STATE.md');
const riskPath = resolve(root, 'docs/RISK_REGISTER.md');

function git(...args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `unavailable (${message.split('\n')[0]})`;
  }
}

function requiredLine(text, label) {
  const match = text.match(new RegExp(`^${label}:\\s*(.+)$`, 'm'));
  if (!match) {
    throw new Error(`Missing "${label}:" in docs/CURRENT_STATE.md`);
  }
  return match[1].trim();
}

function bulletsUnder(text, heading) {
  const headingIndex = text.indexOf(`## ${heading}`);
  if (headingIndex < 0) return [];
  const section = text.slice(headingIndex + heading.length + 3);
  const nextHeading = section.search(/^##\s/m);
  const body = nextHeading >= 0 ? section.slice(0, nextHeading) : section;
  return [...body.matchAll(/^-\s+(.+)$/gm)].map((match) => match[1].trim());
}

function openRisks(text, limit = 5) {
  return text
    .split('\n')
    .filter(
      (line) => line.startsWith('| R-') && !line.includes('| Mitigated |'),
    )
    .slice(0, limit)
    .map((line) => {
      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean);
      return `${cells[0]}: ${cells[1]} [${cells[6]}]`;
    });
}

const state = readFileSync(currentStatePath, 'utf8');
const risks = readFileSync(riskPath, 'utf8');
const porcelain = git('status', '--porcelain');
const blockers = bulletsUnder(state, 'Active blockers');

const report = [
  ['Current branch', git('branch', '--show-current') || '(detached HEAD)'],
  [
    'Working-tree status',
    porcelain === ''
      ? 'clean'
      : `${porcelain.split('\n').length} changed path(s)`,
  ],
  ['Current milestone', requiredLine(state, 'Current milestone')],
  ['Current task', requiredLine(state, 'Current task')],
  ['Last completed task', requiredLine(state, 'Last completed task')],
  ['In-progress task', requiredLine(state, 'In-progress task')],
  ['Verification status', requiredLine(state, 'Verification status')],
  ['Next action', requiredLine(state, 'Next action')],
];

for (const [label, value] of report) {
  console.log(`${label}: ${value}`);
}

console.log('Blockers:');
for (const blocker of blockers.length > 0 ? blockers : ['None documented']) {
  console.log(`- ${blocker}`);
}

console.log('Risks:');
for (const risk of openRisks(risks)) {
  console.log(`- ${risk}`);
}
