import packageJson from '../../package.json';

const { version } = packageJson;

export function isBannerDisabled(): boolean {
  return process.env['LUNATAR_NO_BANNER'] === '1' || process.env['LUNATAR_NO_BANNER'] === 'true';
}

export function printBanner(): void {
  if (isBannerDisabled()) return;
  process.stderr.write(`  ⚒  Lun'Atar v${version}  ·  intent → code\n\n`);
}
