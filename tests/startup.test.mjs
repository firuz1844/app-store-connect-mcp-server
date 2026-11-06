import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
test('built server initializes and lists tools without reading an Apple key', async () => {
  const transport = new StdioClientTransport({ command: process.execPath, args: ['dist/src/index.js'], env: { PATH: process.env.PATH, APP_STORE_CONNECT_KEY_ID: 'test', APP_STORE_CONNECT_ISSUER_ID: 'test', APP_STORE_CONNECT_P8_PATH: '/nonexistent/test-key.p8' }, stderr: 'pipe' });
  const client = new Client({ name: 'startup-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const result = await client.listTools();
    assert.ok(result.tools.some(tool => tool.name === 'list_apps'));
    assert.ok(result.tools.some(tool => tool.name === 'list_schemes'));
  } finally { await client.close(); }
});
