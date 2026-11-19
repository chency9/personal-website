import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceAgent, approveAgent, buildBVH, comparePrecision, createAgentExecution, demoBoxes, intersectBox, resumeAgent, retrieveKnowledge, traceBVH } from '../src/notes/models.ts';

test('relative coordinates preserve a centimetre lost at ECEF magnitude', () => {
  const result = comparePrecision(6378137, .01);
  assert.equal(result.absolute, 0);
  assert.equal(result.ulp, .5);
  assert(Math.abs(result.relative - .01) < 1e-9);
  assert(comparePrecision(1000, .01).ulp < .0001);
});

test('slab handles parallel boundary, negative direction, inside and finite ray segments', () => {
  const box = { id: 1, min: [0, 0, 0], max: [1, 1, 1] };
  const hit = (origin, direction, limit) => intersectBox({ origin, direction }, box, limit);
  assert.equal(hit([-1, .5, .5], [1, 0, 0]), 1);
  assert.equal(hit([0, -1, .5], [-0, 1, 0]), 1);
  assert.equal(hit([-1, 2, .5], [1, 0, 0]), null);
  assert.equal(hit([.5, .5, .5], [1, 0, 0]), 0);
  assert.equal(hit([2, .5, .5], [-1, 0, 0]), 1);
  assert.equal(hit([-1, .5, .5], [1, 0, 0], .5), null);
  assert(Math.abs(hit([-1, .5, .5], [1e-15, 0, 0]) - 1e15) < 1);
  assert.equal(hit([.5, .5, .5], [0, 0, 0]), null);
  assert.equal(hit([NaN, .5, .5], [1, 0, 0]), null);
});

test('BVH nearest hit agrees with brute force for both directions and misses', () => {
  const root = buildBVH(demoBoxes);
  for (const sign of [-1, 1]) for (let height = -1; height <= 9; height += .125) {
    const ray = { origin: [sign > 0 ? -1 : 13, height, .5], direction: [sign, .08, 0] };
    let expected = null;
    let nearest = Infinity;
    for (const box of demoBoxes) {
      const distance = intersectBox(ray, box);
      if (distance !== null && (distance < nearest || distance === nearest && (expected === null || box.id < expected))) {
        expected = box.id;
        nearest = distance;
      }
    }
    const result = traceBVH(root, ray);
    assert.equal(result.hit, expected);
    assert.equal(result.distance, expected === null ? null : nearest);
    assert(result.primitiveTests <= demoBoxes.length);
  }
  const coincident = buildBVH([{ id: 1, min: [0, 0, 0], max: [1, 1, 1] }, { id: 2, min: [0, 0, 0], max: [1, 1, 1] }, { id: 3, min: [0, 0, 0], max: [1, 1, 1] }]);
  assert.equal(traceBVH(coincident, { origin: [-1, .5, .5], direction: [1, 0, 0] }).hit, 1);
});

test('unapproved writes cannot run and receipt-loss recovery reuses the original effect', () => {
  const run = createAgentExecution();
  advanceAgent(run); advanceAgent(run); advanceAgent(run);
  assert.equal(run.step, 'approval');
  assert.equal(run.effects.size, 0);
  approveAgent(run); advanceAgent(run, true);
  assert.equal(run.crashed, true);
  assert.equal(run.step, 'write');
  assert.equal(run.effects.size, 1);
  resumeAgent(run);
  assert.equal(run.step, 'done');
  assert.equal(run.effects.size, 1);
  run.step = 'write';
  advanceAgent(run);
  assert.equal(run.effects.size, 1);
});

test('ACL applies to both ranking branches and revocation removes retrieved candidates', () => {
  const engineering = retrieveKnowledge('engineering');
  assert(engineering.every(document => !document.id.startsWith('salary') && document.id !== 'hr-records'));
  assert.equal(engineering[0].id, 'vpn-guide');
  const hr = retrieveKnowledge('hr');
  assert(hr.every(document => document.id !== 'vpn-guide' && document.id !== 'engineering-review'));
  assert.equal(hr[0].id, 'salary-access');
  const revoked = retrieveKnowledge('engineering', true);
  assert(!revoked.some(document => document.id === 'vpn-guide'));
  assert.equal(revoked[0].id, 'request-process');
  assert(revoked.every(document => document.score > 0 && document.lexicalRank >= 1 && document.vectorRank >= 1));
});
