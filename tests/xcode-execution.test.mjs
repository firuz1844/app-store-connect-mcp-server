import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { XcodeHandlers } from '../dist/src/handlers/xcode.js';

test('Xcode receives literal paths including shell syntax as a single argument', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'xcode-security-'));
  const originalPath = process.env.PATH;
  const originalCwd = process.cwd();
  try {
    await writeFile(path.join(root, 'xcodebuild'), '#!/usr/bin/env node\nrequire("fs").writeFileSync("args.json", JSON.stringify(process.argv.slice(2))); console.log("Schemes:\n    Example");'.replace('Schemes:\n', 'Schemes:\\n'), { mode: 0o755 });
    process.env.PATH = root + path.delimiter + originalPath;
    process.chdir(root);
    for (const name of ['Normal Project.xcodeproj', 'Normal Workspace.xcworkspace', '$(touch injected).xcodeproj', '`touch injected`.xcworkspace', 'Project "quoted" $name.xcodeproj']) {
      await mkdir(name);
      const projectPath = path.join(root, name);
      const result = await new XcodeHandlers().listSchemes({ projectPath });
      assert.deepEqual(JSON.parse(await readFile('args.json', 'utf8')), [name.endsWith('.xcworkspace') ? '-workspace' : '-project', projectPath, '-list']);
      assert.equal(JSON.parse(result.content[0].text).schemes[0].name, 'Example');
      await assert.rejects(access('injected'));
    }
    await assert.rejects(new XcodeHandlers().listSchemes({ projectPath: 'missing.xcodeproj' }), /does not exist/);
  } finally {
    process.chdir(originalCwd);
    process.env.PATH = originalPath;
    await rm(root, { recursive: true, force: true });
  }
});
