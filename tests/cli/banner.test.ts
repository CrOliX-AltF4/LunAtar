import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('banner', () => {
  let originalEnv: string | undefined;
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalEnv = process.env['LUNATAR_NO_BANNER'];
    delete process.env['LUNATAR_NO_BANNER'];
    writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env['LUNATAR_NO_BANNER'];
    } else {
      process.env['LUNATAR_NO_BANNER'] = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it('prints banner to stderr by default', async () => {
    const { printBanner } = await import('../../src/cli/banner.js');
    printBanner();
    expect(writeSpy).toHaveBeenCalledOnce();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Lun'Atar"));
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('intent → code'));
  });

  it('suppresses banner when LUNATAR_NO_BANNER=1', async () => {
    process.env['LUNATAR_NO_BANNER'] = '1';
    const { printBanner } = await import('../../src/cli/banner.js');
    printBanner();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('isBannerDisabled returns true for LUNATAR_NO_BANNER=true', async () => {
    process.env['LUNATAR_NO_BANNER'] = 'true';
    const { isBannerDisabled } = await import('../../src/cli/banner.js');
    expect(isBannerDisabled()).toBe(true);
  });

  it('isBannerDisabled returns false when env var is unset', async () => {
    const { isBannerDisabled } = await import('../../src/cli/banner.js');
    expect(isBannerDisabled()).toBe(false);
  });
});
