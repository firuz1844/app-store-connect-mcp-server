import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { AppStoreConnectClient } from '../dist/src/services/appstore-client.js';
import { downloadReportSegment } from '../dist/src/services/report-download.js';

test('segment downloads preserve signed URLs without generating or transmitting Apple credentials', async () => {
  const previous = axios.defaults.adapter;
  const oldAuth = axios.defaults.headers.common.Authorization;
  const calls = [];
  axios.defaults.headers.common.Authorization = 'Bearer inherited-secret';
  axios.defaults.adapter = async config => {
    calls.push(config);
    assert.equal(config.headers.toJSON().Authorization, undefined);
    assert.equal(config.maxRedirects, 0);
    return { data: 'report', status: 200, statusText: 'OK', headers: { 'content-type': 'text/plain', 'content-length': '6' }, config };
  };
  try {
    const client = new AppStoreConnectClient({ keyId: 'test', issuerId: 'test', privateKeyPath: '/does-not-exist.p8' });
    let tokensGenerated = 0;
    client.authService.generateToken = async () => { tokensGenerated++; return 'synthetic-apple-token'; };
    for (const url of ['https://reports.example/data?signature=a%2Fb&expires=123', 'https://api.appstoreconnect.apple.com/v1/report', 'https://api.appstoreconnect.apple.com.attacker.example/report']) {
      assert.deepEqual(await client.downloadFromUrl(url), { data: 'report', contentType: 'text/plain', size: '6' });
      assert.equal(calls.at(-1).url, url);
    }
    assert.equal(tokensGenerated, 0);
    for (const url of ['http://example.com/report', 'file:///tmp/key.p8', '//example.com/report', 'https://user:pass@example.com/report', 'not a URL']) {
      const before = calls.length;
      await assert.rejects(downloadReportSegment(url));
      assert.equal(calls.length, before);
    }
  } finally {
    axios.defaults.adapter = previous;
    if (oldAuth === undefined) delete axios.defaults.headers.common.Authorization;
    else axios.defaults.headers.common.Authorization = oldAuth;
  }
});
