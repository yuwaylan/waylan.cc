import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caseStudies, isSearchHiddenPath, publicProjects } from '../src/data/projects';

test('withheld projects stay out of public pages and search', () => {
  assert.equal(
    publicProjects.some((project) => project.slug === 'be-water'),
    false,
  );
  assert.equal(
    caseStudies.some((project) => project.slug === 'be-water'),
    false,
  );
  assert.equal(isSearchHiddenPath('/work/be-water'), true);
  assert.equal(isSearchHiddenPath('/work/be-water/'), true);
  assert.equal(isSearchHiddenPath('/images/be-nearby.webp'), true);
  assert.equal(isSearchHiddenPath('/work/skin-texture/'), false);
  assert.equal(isSearchHiddenPath('/images/portrait.webp'), false);
});
