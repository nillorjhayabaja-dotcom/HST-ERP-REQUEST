import prisma from '../config/database.js';

export async function generateControlNumber(module: string): Promise<string> {
  const setting = await prisma.controlNumberSetting.findUnique({ where: { module } });
  if (!setting) {
    throw new Error(`Control number setting not found for module: ${module}`);
  }

  const sequence = String(setting.next_sequence).padStart(setting.padding, '0');
  const year = setting.year;
  const controlNumber = setting.format_template
    .replace('{YYYY}', String(year))
    .replace('{SEQ}', sequence)
    .replace('{PREFIX}', setting.prefix);

  await prisma.controlNumberSetting.update({
    where: { module },
    data: { next_sequence: setting.next_sequence + 1, updated_at: new Date().toISOString() },
  });

  return controlNumber;
}