import type { BackendName } from '../utils/config.js';
import type { PlanningAnswers } from '../ui/prompts.js';

export interface PlannerStepDraft {
  title: string;
  goal: string;
  tasks: string[];
  skills: string[];
}

export interface PlannerConfig {
  backend: BackendName;
}

function normalizeSkill(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function uniqueList(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function createSetupStep(answers: PlanningAnswers): PlannerStepDraft {
  const language = answers.language.trim();
  const framework = answers.framework.trim();
  return {
    title: 'Project Foundation And Tooling',
    goal: `Set up the ${language}${framework ? ` + ${framework}` : ''} workspace, project structure, and developer tooling.`,
    tasks: [
      'Initialize the repository structure, dependencies, and environment configuration',
      'Set up build, run, and local development commands for the chosen stack',
      'Establish shared project conventions, configuration files, and base modules'
    ],
    skills: uniqueList(['scaffolding', normalizeSkill(language), normalizeSkill(framework)])
  };
}

function createFeatureStep(feature: string, answers: PlanningAnswers, index: number): PlannerStepDraft {
  const cleanFeature = feature.trim();
  const framework = answers.framework.trim();
  const language = answers.language.trim();
  const lower = cleanFeature.toLowerCase();

  if (/\blogin\b|\bauth\b|\bsign ?in\b|\bsignup\b|\bsign-up\b|\bregister\b|\bsession\b|\bpermission\b|\baccess control\b/.test(lower)) {
    return {
      title: 'Authentication And User Access',
      goal: 'Implement secure authentication, session handling, and user access control flows.',
      tasks: [
        'Design the authentication flow, user identity model, and authorization boundaries',
        'Implement login, logout, session, and protected route or endpoint behavior',
        'Validate security edge cases, invalid credentials, and user access rules'
      ],
      skills: uniqueList([normalizeSkill(language), normalizeSkill(framework), 'auth'])
    };
  }

  if (/\bapi\b|\bbackend\b|\bservice\b/.test(lower)) {
    return {
      title: 'Core API And Business Services',
      goal: 'Design and implement the primary backend API surface and business logic services.',
      tasks: [
        'Define the service boundaries, routes or handlers, and request-response contracts',
        'Implement the core business logic, integrations, and error handling paths',
        'Validate the API behavior, edge cases, and integration flow end to end'
      ],
      skills: uniqueList([normalizeSkill(language), normalizeSkill(framework), 'rest-api'])
    };
  }

  if (/\bdashboard\b|\breport\b|\bui\b|\bscreen\b/.test(lower)) {
    return {
      title: /\breport\b/.test(lower) ? 'Reporting And Insights' : `${toTitleCase(cleanFeature)} Experience`,
      goal: /\breport\b/.test(lower)
        ? 'Build reporting flows that present useful user-facing insights and summaries.'
        : `Build the ${cleanFeature} workflow with clear data presentation and user interactions.`,
      tasks: [
        /\breport\b/.test(lower)
          ? 'Define report outputs, filters, summary metrics, and data sourcing needs'
          : `Define the ${cleanFeature} user journey, data needs, and UI or delivery flow`,
        /\breport\b/.test(lower)
          ? 'Implement report generation, data aggregation, and presentation behavior'
          : `Implement the ${cleanFeature} components, data wiring, and interaction logic`,
        /\breport\b/.test(lower)
          ? 'Validate reporting accuracy, empty states, and export or sharing edge cases'
          : `Validate ${cleanFeature} usability, empty states, and edge-case behavior`
      ],
      skills: uniqueList([normalizeSkill(language), normalizeSkill(framework)])
    };
  }

  if (/\bcalculator\b|\bbudget\b|\bexpense\b|\bsummary\b/.test(lower)) {
    return {
      title: `${toTitleCase(cleanFeature)} Logic`,
      goal: `Implement the ${cleanFeature} domain rules, calculations, and result presentation.`,
      tasks: [
        `Define the inputs, formulas, and business rules for ${cleanFeature}`,
        `Implement the ${cleanFeature} logic, validations, and supporting data flow`,
        `Validate calculation accuracy, boundary cases, and output clarity`
      ],
      skills: uniqueList([normalizeSkill(language), normalizeSkill(framework)])
    };
  }

  return {
    title: `${toTitleCase(cleanFeature)} Delivery`,
    goal: `Implement the ${cleanFeature} capability and connect it cleanly into the application architecture.`,
    tasks: [
      `Define the ${cleanFeature} workflow, interfaces, and integration points`,
      `Implement the ${cleanFeature} logic, data handling, and user-facing behavior`,
      `Validate ${cleanFeature} against expected flows, failures, and edge cases`
    ],
    skills: uniqueList([normalizeSkill(language), normalizeSkill(framework)])
  };
}

function createQualityStep(answers: PlanningAnswers): PlannerStepDraft {
  return {
    title: 'Quality Assurance And Release Readiness',
    goal: 'Stabilize the application with testing, validation, and release-readiness checks.',
    tasks: [
      'Add or refine tests for the main workflows, business rules, and integration paths',
      'Verify configuration, error handling, and developer or deployment documentation',
      'Review release readiness, remaining risks, and the next iteration backlog'
    ],
    skills: uniqueList(['testing', normalizeSkill(answers.language)])
  };
}

export function buildFallbackSteps(answers: PlanningAnswers): PlannerStepDraft[] {
  const steps: PlannerStepDraft[] = [createSetupStep(answers)];
  const features = uniqueList(answers.features.map((feature) => feature.trim()).filter(Boolean));

  for (const [index, feature] of features.entries()) {
    const nextStep = createFeatureStep(feature, answers, index);
    const existing = steps.find((step) => step.title === nextStep.title);

    if (existing) {
      existing.tasks = uniqueList([...existing.tasks, ...nextStep.tasks]).slice(0, 3);
      existing.skills = uniqueList([...existing.skills, ...nextStep.skills]);
      continue;
    }

    steps.push(nextStep);
  }

  steps.push(createQualityStep(answers));
  return steps.slice(0, 8);
}

function buildPlannerPrompt(answers: PlanningAnswers): string {
  return [
    'You are a senior software architect planning a software delivery roadmap.',
    'Generate a development plan with descriptive implementation steps, not just a copy of the feature list.',
    'Break the work into logical software-development phases such as setup, architecture, backend, frontend, auth, testing, and release readiness when appropriate.',
    'Each step should be actionable, ordered, and broad enough to group related work.',
    '',
    'Return ONLY valid JSON with this shape:',
    '{',
    '  "steps": [',
    '    {',
    '      "title": "short descriptive title",',
    '      "goal": "one-sentence goal",',
    '      "tasks": ["task 1", "task 2", "task 3"],',
    '      "skills": ["typescript", "testing"]',
    '    }',
    '  ]',
    '}',
    '',
    'Rules:',
    '- Include 4 to 8 total steps.',
    '- Include exactly 3 tasks per step.',
    '- Use descriptive step titles like "Authentication And User Access", not raw feature names like "login".',
    '- Combine related requirements into coherent phases when that produces a clearer plan.',
    '- Ensure the first step is project setup or foundation.',
    '- Ensure the final step covers testing, stabilization, or release readiness.',
    '',
    `Project Name: ${answers.projectName}`,
    `Description: ${answers.description}`,
    `Language: ${answers.language}`,
    `Framework: ${answers.framework}`,
    `Database: ${answers.database}`,
    `Requirements: ${answers.features.join(', ')}`,
    `Constraints: ${answers.constraints?.trim() || 'None specified'}`
  ].join('\n');
}

function isValidStepDraft(value: unknown): value is PlannerStepDraft {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { title?: unknown; goal?: unknown; tasks?: unknown; skills?: unknown };
  return typeof candidate.title === 'string'
    && typeof candidate.goal === 'string'
    && Array.isArray(candidate.tasks)
    && candidate.tasks.length === 3
    && candidate.tasks.every((task) => typeof task === 'string' && task.trim().length > 0)
    && Array.isArray(candidate.skills)
    && candidate.skills.every((skill) => typeof skill === 'string');
}

export function parsePlannerResponse(raw: string): PlannerStepDraft[] | null {
  try {
    const parsed = JSON.parse(raw) as { steps?: unknown };
    if (!Array.isArray(parsed.steps)) {
      return null;
    }

    const steps = parsed.steps.filter(isValidStepDraft).map((step) => ({
      title: step.title.trim(),
      goal: step.goal.trim(),
      tasks: step.tasks.map((task) => task.trim()),
      skills: uniqueList(step.skills.map((skill) => normalizeSkill(skill)))
    })).filter((step) => step.title && step.goal && step.tasks.length === 3);

    if (steps.length < 2) {
      return null;
    }

    return steps.slice(0, 8);
  } catch {
    return null;
  }
}

export function buildPlanMarkdown(answers: PlanningAnswers, steps: PlannerStepDraft[]): string {
  const renderedSteps = steps.map((step, index) => {
    const stepNumber = index + 1;
    const skills = uniqueList(step.skills.length > 0 ? step.skills : [normalizeSkill(answers.language)]).join(', ');
    return `### Step ${stepNumber}: ${step.title}\n**Goal**: ${step.goal}\n**Skills**: [${skills}]\n**Agent Team**:\n- 🔍 Researcher: "Research the existing codebase, dependencies, and patterns relevant to ${step.title}. Summarize findings that affect implementation."\n- 🏗 Architect: "Turn the research for ${step.title} into a concrete implementation plan with files, interfaces, and sequencing."\n- ⚙️ Executor: "Implement ${step.title} according to the approved plan and summarize the changes made."\n- 🔎 Reviewer: "Review ${step.title} for completeness and correctness. Respond with JSON: { verdict, notes, tasks_completed }"\n\n**Tasks**:\n- [ ] ${stepNumber}.1 ${step.tasks[0]}\n- [ ] ${stepNumber}.2 ${step.tasks[1]}\n- [ ] ${stepNumber}.3 ${step.tasks[2]}\n`;
  }).join('\n');

  return `# Project Plan: ${answers.projectName}\n\n## Overview\n${answers.description}\n\n## Workspace\n- Root Directory: ${answers.projectDir}\n\n## Tech Stack\n- Language: ${answers.language}\n- Framework: ${answers.framework}\n- Database: ${answers.database}\n\n## Team Config\n- Mode: ${answers.teamMode}\n- Agent Backend: ${answers.agent}\n- Confirmation: ${answers.confirmationMode}\n\n## Constraints & Guidelines\n${answers.constraints?.trim() || 'None specified'}\n\n## Build Steps\n\n${renderedSteps}`;
}

export function buildExecutionConfig<
  T extends { agent: string; teamMode: string; confirmationMode: string }
>(
  config: T,
  planTeamConfig: { agent?: string; mode?: string; confirmationMode?: string }
): T {
  return {
    ...config,
    agent: (planTeamConfig.agent || config.agent) as T['agent'],
    teamMode: (planTeamConfig.mode || config.teamMode) as T['teamMode'],
    confirmationMode: (planTeamConfig.confirmationMode || config.confirmationMode) as T['confirmationMode']
  };
}

export function createPlanner(config: PlannerConfig) {
  return {
    async generatePlan(answers: PlanningAnswers): Promise<{ steps: PlannerStepDraft[]; source: 'ai' | 'fallback' }> {
      const fallback = buildFallbackSteps(answers);
      try {
        const { getBackend } = await import('./agents/backends/codex.js');
        const backend = getBackend(config.backend);
        const output = await backend.run(buildPlannerPrompt(answers));
        const parsed = parsePlannerResponse(output);
        if (parsed && parsed.length > 0) {
          return { steps: parsed, source: 'ai' };
        }
      } catch {
        // Fall back to heuristic planning when AI planning is unavailable.
      }

      return { steps: fallback, source: 'fallback' };
    }
  };
}
