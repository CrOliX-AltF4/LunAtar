import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AgentRole } from '../types/index.js';
import type { Skill } from './types.js';

const CATALOG_DIR = join(dirname(fileURLToPath(import.meta.url)), 'catalog');

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function loadMd(filename: string): string {
  return readFileSync(join(CATALOG_DIR, filename), 'utf-8');
}

const CATALOG: Omit<Skill, 'content' | 'tokenEstimate'>[] = [
  {
    id: 'typescript-strict',
    name: 'TypeScript Strict',
    description: 'Enforce strict TS: noImplicitAny, exactOptionalPropertyTypes, no-any',
    role: 'all',
    cacheable: true,
  },
  {
    id: 'react-css-modules',
    name: 'React + CSS Modules',
    description: 'Component structure with CSS Modules, no inline styles, BEM naming',
    role: 'dev',
    cacheable: true,
  },
  {
    id: 'conventional-commits',
    name: 'Conventional Commits',
    description: 'feat/fix/chore commit messages, semantic versioning',
    role: 'all',
    cacheable: true,
  },
  {
    id: 'project-context',
    name: 'Project Context',
    description: 'Inject package.json, git status and folder structure into every agent',
    role: 'all',
    cacheable: false,
  },
  {
    id: 'laravel-conventions',
    name: 'Laravel Conventions',
    description: 'PSR-12, Eloquent patterns, Form Request validation, resource controllers',
    role: 'dev',
    cacheable: true,
  },
  {
    id: 'test-conventions',
    name: 'Testing Conventions',
    description: 'Unit + integration coverage, AAA pattern, no over-mocking',
    role: 'all',
    cacheable: true,
  },
  {
    id: 'api-design',
    name: 'REST API Design',
    description: 'RESTful naming, status codes, pagination, versioning, OpenAPI docs',
    role: 'all',
    cacheable: true,
  },
  {
    id: 'i18n',
    name: 'Internationalisation',
    description: 'i18n keys, no hardcoded strings, locale-aware date/number formatting',
    role: 'all',
    cacheable: true,
  },
  {
    id: 'security',
    name: 'Security Best Practices',
    description: 'OWASP top-10, input validation, no secrets in code, CSP headers',
    role: 'all',
    cacheable: true,
  },
];

export class SkillRegistry {
  private readonly skills: Skill[];

  constructor(externals: Skill[] = []) {
    this.skills = [
      ...CATALOG.map((entry) => {
        const content = loadMd(`${entry.id}.md`);
        return { ...entry, content, tokenEstimate: estimateTokens(content) };
      }),
      ...externals,
    ];
  }

  getAll(): Skill[] {
    return this.skills;
  }

  getById(id: string): Skill | undefined {
    return this.skills.find((s) => s.id === id);
  }

  forRole(role: AgentRole): Skill[] {
    return this.skills.filter((s) => s.role === role || s.role === 'all');
  }
}
