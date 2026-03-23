import test from 'node:test';
import assert from 'node:assert/strict';

import { buildExecutionConfig, buildFallbackSteps, buildPlanMarkdown, parsePlannerResponse } from '../src/core/planner.ts';

const answers = {
  projectName: 'Golang budget app',
  description: 'Budget management app with API, dashboard, login, reports, and expense calculation.',
  language: 'Golang',
  framework: 'Echo',
  database: 'PostgreSQL',
  features: ['api', 'dashboard', 'login', 'user report', 'expense calculator'],
  constraints: 'Keep the plan clear and software-delivery oriented.',
  agent: 'claude-code',
  teamMode: 'full',
  confirmationMode: 'per-step'
};

test('fallback planner creates descriptive software-development steps', () => {
  const steps = buildFallbackSteps(answers);
  const titles = steps.map((step) => step.title);

  assert.ok(steps.length >= 4);
  assert.equal(steps[0].title, 'Project Foundation And Tooling');
  assert.equal(steps.at(-1)?.title, 'Quality Assurance And Release Readiness');
  assert.ok(steps.some((step) => step.title === 'Core API And Business Services'));
  assert.ok(steps.some((step) => step.title === 'Authentication And User Access'));
  assert.ok(steps.some((step) => step.title === 'Reporting And Insights'));
  assert.ok(steps.every((step) => step.tasks.length === 3));
  assert.ok(steps.every((step) => !['api', 'dashboard', 'login'].includes(step.title.toLowerCase())));
  assert.equal(new Set(titles).size, titles.length);
});

test('planner response parser accepts valid JSON step plans', () => {
  const parsed = parsePlannerResponse(JSON.stringify({
    steps: [
      {
        title: 'Project Foundation And Tooling',
        goal: 'Set up the workspace and baseline tooling.',
        tasks: ['Initialize the repo', 'Configure tooling', 'Create shared project conventions'],
        skills: ['Go', 'Echo']
      },
      {
        title: 'Quality Assurance And Release Readiness',
        goal: 'Validate the app before release.',
        tasks: ['Add tests', 'Review docs', 'Assess release risks'],
        skills: ['testing']
      }
    ]
  }));

  assert.ok(parsed);
  assert.equal(parsed?.[0]?.skills[0], 'go');
  assert.equal(parsed?.[0]?.title, 'Project Foundation And Tooling');
});

test('buildPlanMarkdown renders descriptive step titles into PLAN.md', () => {
  const markdown = buildPlanMarkdown(answers, buildFallbackSteps(answers));

  assert.match(markdown, /### Step 1: Project Foundation And Tooling/);
  assert.match(markdown, /### Step \d+: Authentication And User Access/);
  assert.doesNotMatch(markdown, /### Step 2: api/);
});

test('execution config prefers PLAN.md backend and mode over default config', () => {
  const executionConfig = buildExecutionConfig(
    {
      agent: 'claude-code',
      teamMode: 'full',
      confirmationMode: 'per-step',
      planFile: 'PLAN.md'
    },
    {
      agent: 'codex',
      mode: 'research',
      confirmationMode: 'auto'
    }
  );

  assert.equal(executionConfig.agent, 'codex');
  assert.equal(executionConfig.teamMode, 'research');
  assert.equal(executionConfig.confirmationMode, 'auto');
});
