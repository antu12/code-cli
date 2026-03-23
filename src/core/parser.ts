import { readFile, writeFile } from 'node:fs/promises';

export interface ParsedTask {
  id: string;
  label: string;
  completed: boolean;
}

export interface ParsedStep {
  index: number;
  title: string;
  goal: string;
  skills: string[];
  agentPrompts: {
    researcher?: string;
    architect?: string;
    executor?: string;
    reviewer?: string;
  };
  tasks: ParsedTask[];
}

export interface ParsedPlan {
  name: string;
  overview: string;
  techStack: Record<string, string>;
  teamConfig: {
    mode: string;
    agent: string;
    confirmationMode: string;
  };
  steps: ParsedStep[];
}

const DEFAULT_PLAN_FILE = 'PLAN.md';

function sectionContent(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^## ${escaped}\\n([\\s\\S]*?)(?=^## |$)`, 'm');
  return regex.exec(markdown)?.[1]?.trim() ?? '';
}

function parseBulletMap(section: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const line of section.split('\n')) {
    const match = /^-\s+([^:]+):\s*(.+)$/.exec(line.trim());
    if (match) {
      map[match[1].trim()] = match[2].trim();
    }
  }
  return map;
}

function parseSkills(raw: string): string[] {
  const match = /\[([^\]]*)\]/.exec(raw);
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAgentPrompts(stepBlock: string): ParsedStep['agentPrompts'] {
  const promptMap: ParsedStep['agentPrompts'] = {};
  const agentTeamMatch = /\*\*Agent Team\*\*:\n([\s\S]*?)(?=\n\*\*Tasks\*\*:|$)/.exec(stepBlock);

  if (!agentTeamMatch) {
    return promptMap;
  }

  for (const line of agentTeamMatch[1].split('\n')) {
    const trimmed = line.trim();
    const match = /^-\s+.+?\s+(Researcher|Architect|Executor|Reviewer):\s+"([\s\S]+)"\s*$/.exec(trimmed);
    if (!match) {
      continue;
    }

    const role = match[1].toLowerCase() as keyof ParsedStep['agentPrompts'];
    promptMap[role] = match[2];
  }

  return promptMap;
}

function parseTasks(stepBlock: string): ParsedTask[] {
  const tasksMatch = /\*\*Tasks\*\*:\n([\s\S]*?)$/.exec(stepBlock);
  if (!tasksMatch) {
    return [];
  }

  const tasks: ParsedTask[] = [];
  for (const line of tasksMatch[1].split('\n')) {
    const match = /^-\s+\[( |x)\]\s+([^\s]+)\s+(.+)$/.exec(line.trim());
    if (!match) {
      continue;
    }

    tasks.push({
      id: match[2],
      label: match[3].trim(),
      completed: match[1] === 'x'
    });
  }

  return tasks;
}

function parseSteps(markdown: string): ParsedStep[] {
  const lines = markdown.split('\n');
  const steps: ParsedStep[] = [];

  let index = 0;
  while (index < lines.length) {
    const headingMatch = /^### Step (\d+):\s+(.+)$/.exec(lines[index]);
    if (!headingMatch) {
      index += 1;
      continue;
    }

    const stepLines: string[] = [];
    index += 1;
    while (index < lines.length && !/^### Step \d+:/.test(lines[index])) {
      stepLines.push(lines[index]);
      index += 1;
    }

    const block = stepLines.join('\n').trim();
    const stepIndex = Number(headingMatch[1]);
    const title = headingMatch[2].trim();
    const goal = /\*\*Goal\*\*:\s*(.+)/.exec(block)?.[1]?.trim() ?? '';
    const skillsLine = /\*\*Skills\*\*:\s*(.+)/.exec(block)?.[1]?.trim() ?? '[]';

    steps.push({
      index: stepIndex,
      title,
      goal,
      skills: parseSkills(skillsLine),
      agentPrompts: parseAgentPrompts(block),
      tasks: parseTasks(block)
    });
  }

  return steps;
}

export async function readPlan(planFile = DEFAULT_PLAN_FILE): Promise<ParsedPlan> {
  const markdown = await readFile(planFile, 'utf8');
  const name = /^# Project Plan:\s+(.+)$/m.exec(markdown)?.[1]?.trim() ?? 'Untitled';
  const overview = sectionContent(markdown, 'Overview');
  const techStackSection = sectionContent(markdown, 'Tech Stack');
  const teamConfigSection = sectionContent(markdown, 'Team Config');
  const techStack = parseBulletMap(techStackSection);
  const teamConfigMap = parseBulletMap(teamConfigSection);

  return {
    name,
    overview,
    techStack,
    teamConfig: {
      mode: teamConfigMap.Mode ?? 'full',
      agent: teamConfigMap['Agent Backend'] ?? 'claude-code',
      confirmationMode: teamConfigMap.Confirmation ?? 'per-step'
    },
    steps: parseSteps(markdown)
  };
}

async function updatePlanContent(
  updater: (current: string) => string | null,
  planFile = DEFAULT_PLAN_FILE
): Promise<void> {
  const current = await readFile(planFile, 'utf8');
  const next = updater(current);
  if (next !== null && next !== current) {
    await writeFile(planFile, next, 'utf8');
  }
}

export async function markTaskComplete(stepIndex: number, taskId: string, planFile = DEFAULT_PLAN_FILE): Promise<void> {
  await updatePlanContent((current) => {
    const stepRegex = new RegExp(`(### Step ${stepIndex}:\\s+.+?\\n[\\s\\S]*?)(?=^### Step \\d+:|$)`, 'm');
    const stepMatch = stepRegex.exec(current);

    if (!stepMatch) {
      return null;
    }

    const updatedStep = stepMatch[1].replace(
      new RegExp(`^-\\s+\\[ \\]\\s+${taskId.replace('.', '\\.')}\\s+`, 'm'),
      `- [x] ${taskId} `
    );

    return `${current.slice(0, stepMatch.index)}${updatedStep}${current.slice(stepMatch.index + stepMatch[1].length)}`;
  }, planFile);
}

export async function markStepComplete(stepIndex: number, planFile = DEFAULT_PLAN_FILE): Promise<void> {
  await updatePlanContent((current) => {
    const stepRegex = new RegExp(`(### Step ${stepIndex}:\\s+.+?\\n[\\s\\S]*?)(?=^### Step \\d+:|$)`, 'm');
    const stepMatch = stepRegex.exec(current);

    if (!stepMatch) {
      return null;
    }

    const updatedStep = stepMatch[1].replace(/-\s+\[ \]\s+/g, '- [x] ');
    return `${current.slice(0, stepMatch.index)}${updatedStep}${current.slice(stepMatch.index + stepMatch[1].length)}`;
  }, planFile);
}

export function getStepProgress(plan: ParsedPlan): { total: number; completed: number; current: number } {
  const total = plan.steps.length;
  const completed = plan.steps.filter((step) => step.tasks.length > 0 && step.tasks.every((task) => task.completed)).length;
  const currentStep = plan.steps.find((step) => step.tasks.some((task) => !task.completed));

  return {
    total,
    completed,
    current: currentStep?.index ?? 0
  };
}
