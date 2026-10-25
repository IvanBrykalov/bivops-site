'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {subnet, encode64, decode64} = require('../dist/app.js');
const {resultMessage} = require('../dist/quiz.js');
const questions = require('../dist/questions.js');

test('IPv4 ordinary subnet and /0, /31, /32 boundaries', () => {
  assert.match(subnet('192.168.1.129/25'), /Network: 192\.168\.1\.128\/25/);
  assert.match(subnet('192.168.1.129/25'), /Last address: 192\.168\.1\.255/);
  assert.match(subnet('255.255.255.255/0'), /Total addresses: 4294967296/);
  assert.match(subnet('10.0.0.1/31'), /Usable host addresses: 2/);
  assert.match(subnet('10.0.0.1/32'), /Host range: 10\.0\.0\.1 - 10\.0\.0\.1/);
  for (const value of ['256.1.1.1/24', '1.1.1.1/33', 'hello', '::1/128']) {
    assert.throws(() => subnet(value));
  }
});
test('Base64 preserves UTF-8 and rejects invalid UTF-8', () => {
  for (const value of ['', 'BIVOPS', 'Привет 👋']) assert.equal(decode64(encode64(value)), value);
  assert.equal(encode64('BIVOPS'), 'QklWT1BT');
  assert.throws(() => decode64('/w=='));
});
test('Each quiz answer has feedback and an HTTPS documentation link', () => {
  assert.equal(questions.length, 8);
  assert.equal(new Set(questions.map(q => q.id)).size, 8);
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    assert.equal(q.feedback.length, 4);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4);
    assert.ok(q.feedback.every(s => typeof s === 'string' && s.length > 0));
    assert.equal(new URL(q.url).protocol, 'https:');
  }
});
test('Score boundaries return distinct, complete feedback', () => {
  const bands = [0, 4, 6, 8].map(score => resultMessage(score, 8));
  assert.equal(new Set(bands.map(x => x[0])).size, 4);
  for (const band of bands) assert.ok(band.length === 2 && band.every(s => s.length > 0));
  assert.deepEqual(resultMessage(3, 8), bands[0]);
  assert.deepEqual(resultMessage(7, 8), bands[2]);
});
