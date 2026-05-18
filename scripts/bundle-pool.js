#!/usr/bin/env node
/**
 * bundle-pool.js  (ptarmigan)
 * ─────────────────────────
 * Builds and syncs the ptarmigan runtime bundle into the extension's pool/ directory before packaging.
 * Reads from dist/runtime-resources/ptarmigan/ — subset profile (core_required + public_optional).
 *
 * Usage:
 *   node scripts/bundle-pool.js
 *
 * Source resolution (first match wins):
 *   1. JUNAI_SOURCE env var (explicit path to a repo root or .github/ directory)
 *   2. ../../                (agent-sandbox root when running from vscode-extensions/ptarmigan)
 *   3. ../junai              (fallback sibling repo)
 *
 * If no source is found the existing pool/ content is left untouched.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SKIP = new Set(['.git', 'node_modules', '__pycache__', '.mypy_cache', '.pytest_cache', '.DS_Store', '.venv']);

const ROOT = path.resolve(__dirname, '..');
const poolDir = path.join(ROOT, 'pool');

function normalizeRepoRoot(candidate) {
    if (!candidate) {
        return null;
    }
    const resolved = path.resolve(candidate);
    return path.basename(resolved) === '.github' ? path.dirname(resolved) : resolved;
}

function resolveSourceRoot() {
    if (process.env.JUNAI_SOURCE) {
        const env = normalizeRepoRoot(process.env.JUNAI_SOURCE);
        if (env && fs.existsSync(env)) {
            return env;
        }
        console.warn(`⚠  JUNAI_SOURCE set but not found: ${process.env.JUNAI_SOURCE}`);
    }

    const candidates = [
        path.resolve(ROOT, '..', '..'),
        path.resolve(ROOT, '..', 'junai'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

function runExporter(sourceRoot) {
    const exporter = path.join(sourceRoot, 'export_runtime_resources.py');
    if (!fs.existsSync(exporter)) {
        console.warn(`⚠  Exporter not found, skipping runtime export: ${exporter}`);
        return false;
    }

    const candidates = [
        { cmd: path.join(sourceRoot, '.venv', 'Scripts', 'python.exe'), args: [exporter, '--profile', 'ptarmigan'] },
        { cmd: 'python', args: [exporter, '--profile', 'ptarmigan'] },
        { cmd: 'py', args: ['-3', exporter, '--profile', 'ptarmigan'] },
    ];

    for (const candidate of candidates) {
        if (candidate.cmd.includes(path.sep) && !fs.existsSync(candidate.cmd)) {
            continue;
        }

        const result = spawnSync(candidate.cmd, candidate.args, {
            cwd: sourceRoot,
            encoding: 'utf8',
            stdio: 'pipe',
        });

        if (result.status === 0) {
            const output = [result.stdout, result.stderr].filter(Boolean).join('').trim();
            if (output) {
                console.log(output);
            }
            return true;
        }
    }

    console.warn('⚠  Failed to build runtime exports. pool/ content left as-is.');
    return false;
}

function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`  ⚠  Not found, skipping: ${path.relative(ROOT, src)}`);
        return 0;
    }

    fs.mkdirSync(dest, { recursive: true });
    const parentName = path.basename(dest);
    let count = 0;

    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (SKIP.has(entry.name)) {
            continue;
        }
        if (entry.isDirectory() && entry.name === parentName) {
            console.warn(`  ⚠  Skipping accidental nesting: ${path.relative(ROOT, src)}/${entry.name}/`);
            continue;
        }

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            count += copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            count++;
        }
    }

    return count;
}

console.log('\n🔧  Bundling ptarmigan runtime resources → pool/');

const sourceRoot = resolveSourceRoot();
if (!sourceRoot) {
    console.warn('⚠  No source found. pool/ content left as-is.\n');
    console.warn('   Set JUNAI_SOURCE=<path-to-repo-root-or-.github> to specify source explicitly.\n');
    process.exit(0);
}
console.log(`   Source : ${sourceRoot}\n`);

if (!runExporter(sourceRoot)) {
    process.exit(0);
}

const runtimeRoot = path.join(sourceRoot, 'dist', 'runtime-resources');
if (!fs.existsSync(runtimeRoot)) {
    console.warn(`⚠  Runtime export output not found: ${runtimeRoot}`);
    process.exit(0);
}

if (fs.existsSync(poolDir)) {
    fs.rmSync(poolDir, { recursive: true, force: true });
}
fs.mkdirSync(poolDir, { recursive: true });

let total = 0;
const runtimes = [
    { name: 'ptarmigan', folder: '.github' },
];

for (const runtime of runtimes) {
    const src = path.join(runtimeRoot, runtime.name, runtime.folder);
    const dest = path.join(poolDir, runtime.folder);
    if (!fs.existsSync(src)) {
        console.warn(`  ⚠  Missing runtime folder, skipped: ${runtime.name}/${runtime.folder}`);
        continue;
    }
    const count = copyDirSync(src, dest);
    console.log(`  ✓  ${runtime.folder.padEnd(20)} ${count} files`);
    total += count;
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
fs.writeFileSync(path.join(poolDir, 'POOL_VERSION'), pkg.version, 'utf8');

// ── Strip handoffs to agents not present in this pool ──────────────────────
// Prevents dead-end buttons appearing in the VS Code Copilot chat UI when
// a user is running ptarmigan (a subset pool) and Orchestrator/Planner etc.
// reference full-pool agents that aren't bundled here.
(function stripOutOfPoolHandoffs() {
    const agentsDir = path.join(poolDir, '.github', 'agents');
    if (!fs.existsSync(agentsDir)) return;

    // Build set of available agent slugs from filenames
    const poolAgentSlugs = new Set(
        fs.readdirSync(agentsDir)
            .filter(f => f.endsWith('.agent.md'))
            .map(f => f.replace(/\.agent\.md$/, ''))
    );

    // Also build a set of display names (title-case slug → name)
    // by reading the `name:` frontmatter from each agent file
    const poolAgentNames = new Set();
    for (const slug of poolAgentSlugs) {
        const content = fs.readFileSync(path.join(agentsDir, `${slug}.agent.md`), 'utf8');
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        if (nameMatch) poolAgentNames.add(nameMatch[1].trim());
        // Also add slug-derived name (e.g. "code-reviewer" → "Code Reviewer")
        poolAgentNames.add(slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '));
    }

    let patchedFiles = 0;
    let removedHandoffs = 0;

    for (const slug of poolAgentSlugs) {
        const filePath = path.join(agentsDir, `${slug}.agent.md`);
        let content = fs.readFileSync(filePath, 'utf8');

        // Normalize CRLF → LF so regex line anchors work correctly
        const hasCrlf = content.includes('\r\n');
        const normalized = content.replace(/\r\n/g, '\n');

        // Match YAML handoff blocks in the frontmatter
        // Each block starts with "  - label:" and continues with indented lines
        const handoffBlockRe = /^  - label: .+?\n(?:    .+\n)*/gm;
        const agentLineRe = /^    agent: (.+)$/m;

        let patched = normalized.replace(handoffBlockRe, (block) => {
            const agentLine = block.match(agentLineRe);
            if (!agentLine) return block; // no agent line, keep block

            const refName = agentLine[1].trim();
            const refSlug = refName.toLowerCase().replace(/\s+/g, '-');

            if (poolAgentSlugs.has(refSlug) || poolAgentNames.has(refName)) {
                return block; // in-pool, keep
            }

            removedHandoffs++;
            return ''; // out-of-pool, strip
        });

        // Restore CRLF if file originally used it
        if (hasCrlf) patched = patched.replace(/\n/g, '\r\n');

        if (patched !== content) {
            fs.writeFileSync(filePath, patched, 'utf8');
            patchedFiles++;
        }
    }

    if (removedHandoffs > 0) {
        console.log(`  ✓  Stripped ${removedHandoffs} out-of-pool handoffs from ${patchedFiles} agent file(s)`);
    }
})();

console.log(`\n✅  Pool bundled — ${total} files written to pool/  [pool version: ${pkg.version}]\n`);

