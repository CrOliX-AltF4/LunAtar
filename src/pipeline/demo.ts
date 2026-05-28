import { randomUUID } from 'node:crypto';
import type { PipelineStep, PipelineRun } from '../types/index.js';
import type { PipelineEvent } from '../types/events.js';

// ─── Mock outputs ─────────────────────────────────────────────────────────────

const MOCK_PO = {
  clarifiedGoal: 'Build a minimal REST API with JWT authentication',
  requirements: [
    'POST /auth/login returns a signed JWT',
    'GET /users/:id returns profile (protected)',
  ],
  constraints: ['TypeScript strict mode', 'No external auth library'],
  acceptanceCriteria: ['Login validates credentials', 'Protected routes reject missing tokens'],
  assumptions: ['SQLite for local storage', 'Node.js 20+'],
  complexity: 'medium' as const,
};

const MOCK_PLANNER = {
  architecture: 'Express.js layered API — router → middleware → controller. JWT signed with HS256.',
  techStack: ['Node.js', 'TypeScript', 'Express', 'better-sqlite3', 'jsonwebtoken'],
  tasks: [
    { id: 't1', description: 'Create auth router with POST /login', dependsOn: [] },
    { id: 't2', description: 'Implement JWT verify middleware', dependsOn: ['t1'] },
    { id: 't3', description: 'Create users router with GET /:id', dependsOn: ['t2'] },
  ],
  estimatedFiles: [
    'src/routes/auth.ts',
    'src/middleware/auth.ts',
    'src/routes/users.ts',
    'src/index.ts',
  ],
  risks: ['JWT secret management — must use env var', 'SQL injection risk in raw queries'],
};

const MOCK_DEV = {
  files: [
    {
      path: 'src/middleware/auth.ts',
      description: 'JWT authentication middleware',
      content: `import type { Request, Response, NextFunction } from 'express';\nimport jwt from 'jsonwebtoken';\n\nexport function authenticate(req: Request, res: Response, next: NextFunction): void {\n  const header = req.headers.authorization;\n  if (!header?.startsWith('Bearer ')) {\n    res.status(401).json({ error: 'Unauthorized' });\n    return;\n  }\n  try {\n    const secret = process.env['JWT_SECRET'] ?? 'change-me';\n    const payload = jwt.verify(header.slice(7), secret);\n    (req as Request & { user: unknown }).user = payload;\n    next();\n  } catch {\n    res.status(401).json({ error: 'Invalid token' });\n  }\n}\n`,
    },
    {
      path: 'src/routes/auth.ts',
      description: 'Authentication router — POST /login',
      content: `import { Router } from 'express';\nimport jwt from 'jsonwebtoken';\n\nexport const authRouter = Router();\n\nauthRouter.post('/login', (req, res) => {\n  const { username, password } = req.body as { username: string; password: string };\n  if (!username || !password) {\n    res.status(400).json({ error: 'username and password required' });\n    return;\n  }\n  // Demo: any credentials accepted — replace with DB lookup\n  const secret = process.env['JWT_SECRET'] ?? 'change-me';\n  const token = jwt.sign({ sub: username }, secret, { expiresIn: '1h' });\n  res.json({ token });\n});\n`,
    },
    {
      path: 'src/routes/users.ts',
      description: 'User profile router — GET /:id (protected)',
      content: `import { Router } from 'express';\nimport type { Request } from 'express';\nimport { authenticate } from '../middleware/auth.js';\n\nexport const usersRouter = Router();\n\nusersRouter.get('/:id', authenticate, (req, res) => {\n  const user = (req as Request & { user: unknown }).user;\n  res.json({ id: req.params['id'], principal: user });\n});\n`,
    },
    {
      path: 'src/index.ts',
      description: 'Express app entry point',
      content: `import express from 'express';\nimport { authRouter } from './routes/auth.js';\nimport { usersRouter } from './routes/users.js';\n\nconst app = express();\napp.use(express.json());\n\napp.use('/auth', authRouter);\napp.use('/users', usersRouter);\n\nconst PORT = Number(process.env['PORT']) || 3000;\napp.listen(PORT, () => {\n  console.log(\`Server listening on http://localhost:\${PORT}\`);\n});\n`,
    },
  ],
  summary:
    'Implemented a 4-file JWT-authenticated Express API. Login issues tokens; the users route validates them via middleware.',
  approach:
    'Used Express Router modularization with a reusable `authenticate` middleware. JWT signed with HS256 and configurable secret via env.',
};

const MOCK_QA = {
  verdict: 'pass' as const,
  score: 87,
  issues: [
    {
      severity: 'minor' as const,
      description:
        'Default JWT secret "change-me" used when env var is missing — add startup check',
      file: 'src/middleware/auth.ts',
    },
    {
      severity: 'minor' as const,
      description:
        'No credential validation against a data source in /login — acceptable for demo scope',
      file: 'src/routes/auth.ts',
    },
  ],
  suggestions: [
    'Add request body validation with zod or express-validator',
    'Add a refresh-token endpoint for production use',
    'Consider rate-limiting the /login route',
  ],
  summary:
    'Solid structure with minor security hardening opportunities. All acceptance criteria met.',
};

// ─── Step timing ──────────────────────────────────────────────────────────────

const STEP_DELAY_MS: Record<string, number> = {
  po: 1800,
  planner: 2200,
  dev: 3500,
  qa: 1600,
};

const STEP_TOKENS: Record<string, number> = {
  po: 310,
  planner: 460,
  dev: 2080,
  qa: 370,
};

const STEP_COST: Record<string, number> = {
  po: 0.00011,
  planner: 0.00018,
  dev: 0.00082,
  qa: 0.00014,
};

const STEP_OUTPUT: Record<string, unknown> = {
  po: MOCK_PO,
  planner: MOCK_PLANNER,
  dev: MOCK_DEV,
  qa: MOCK_QA,
};

// ─── Demo runner ──────────────────────────────────────────────────────────────

export async function runDemoPipeline(
  intent: string,
  steps: PipelineStep[],
  onUpdate?: (step: PipelineStep) => void,
  onEvent?: (event: PipelineEvent) => void,
): Promise<PipelineRun> {
  const run: PipelineRun = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    intent,
    steps: steps.map((s) => ({ ...s, status: s.status === 'skipped' ? 'skipped' : 'pending' })),
    totalCostUsd: 0,
    totalTokens: 0,
    totalDurationMs: 0,
    status: 'running',
  };

  const wallStart = Date.now();

  const patch = (stepId: string, changes: Partial<PipelineStep>): void => {
    const idx = run.steps.findIndex((s) => s.id === stepId);
    if (idx === -1) return;
    const updated = { ...(run.steps[idx] as PipelineStep), ...changes };
    run.steps[idx] = updated;
    onUpdate?.(updated);
  };

  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  for (const step of run.steps) {
    if (step.status === 'skipped') {
      onUpdate?.(step);
      continue;
    }

    patch(step.id, { status: 'running' });
    onEvent?.({
      type: 'step_started',
      stepId: step.id,
      role: step.role,
      provider: 'groq',
      modelId: 'llama-3.3-70b-versatile',
    });

    await delay(STEP_DELAY_MS[step.role] ?? 2000);

    const tokens = STEP_TOKENS[step.role] ?? 300;
    const cost = STEP_COST[step.role] ?? 0.0001;
    const duration = STEP_DELAY_MS[step.role] ?? 2000;
    const output = STEP_OUTPUT[step.role] ?? {};

    patch(step.id, {
      status: 'completed',
      output: JSON.stringify(output),
      tokensUsed: tokens,
      costUsd: cost,
      durationMs: duration,
    });

    onEvent?.({
      type: 'step_completed',
      stepId: step.id,
      role: step.role,
      costUsd: cost,
      tokensUsed: tokens,
      durationMs: duration,
    });
  }

  run.totalCostUsd = run.steps.reduce((sum, s) => sum + (s.costUsd ?? 0), 0);
  run.totalTokens = run.steps.reduce((sum, s) => sum + (s.tokensUsed ?? 0), 0);
  run.totalDurationMs = Date.now() - wallStart;
  run.status = 'completed';
  return run;
}
