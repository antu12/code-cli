import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadSkills(skillNames: string[], skillsDir = './skills'): Promise<string> {
  if (skillNames.length === 0) {
    return '';
  }

  const contents = await Promise.all(
    skillNames.map(async (skillName) => {
      try {
        return await readFile(join(skillsDir, `${skillName}.md`), 'utf8');
      } catch {
        return '';
      }
    })
  );

  return contents.filter(Boolean).join('\n\n').trim();
}
