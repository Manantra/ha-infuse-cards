import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../dist/infuse-dashboard-cards.js', import.meta.url), 'utf8');
const MODULE_PATH = '/api/infuse/cards/infuse-dashboard-cards.js';
assert.match(source, /await import\("\/api\/infuse\/cards\/infuse-dashboard-cards\.js"\)/);

let testIndex = 0;
function fakeBrowser() {
  const registry = new Map();
  globalThis.HTMLElement = class {attachShadow() {return {innerHTML: ''};}};
  globalThis.window = {customCards: []};
  globalThis.customElements = {
    get(name) {return registry.get(name);},
    define(name, element) {
      if (registry.has(name)) throw Error('Duplicate custom element: ' + name);
      registry.set(name, element);
    },
  };
  return registry;
}

async function runShim(bundledSource) {
  const url = `data:text/javascript,${encodeURIComponent(bundledSource)}`;
  const code = source.replace(`"${MODULE_PATH}"`, JSON.stringify(url));
  const module = `data:text/javascript,${encodeURIComponent(code)}#test${++testIndex}`;
  return import(module);
}

function assertRegistered(registry) {
  for (const element of [
    'infuse-now-playing-card', 'infuse-household-card',
    'infuse-now-playing-card-editor', 'infuse-household-card-editor',
  ]) assert.ok(registry.get(element), `${element} is registered`);
  assert.deepEqual(window.customCards.map(x => x.type), [
    'infuse-now-playing-card', 'infuse-household-card',
  ]);
}

test('bridge loads modern bundled integration module, never frozen fallback', async () => {
  const registry = fakeBrowser();
  const modern = `
    for (const name of ['infuse-now-playing-card', 'infuse-household-card',
      'infuse-now-playing-card-editor', 'infuse-household-card-editor']) {
      customElements.define(name, class ModernCard {static origin = 'bundled';});
    }
    window.customCards.push({type:'infuse-now-playing-card'}, {type:'infuse-household-card'});
  `;
  await runShim(modern);
  assertRegistered(registry);
  for (const card of registry.values()) assert.equal(card.origin, 'bundled');
});

test('bridge falls back to functioning original cards if the integration bundle is missing', async () => {
  const registry = fakeBrowser();
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    await runShim('throw new Error("404: integration not upgraded yet")');
  } finally {
    console.warn = original;
  }
  assertRegistered(registry);
  assert.ok(registry.get('infuse-household-card').getConfigElement);
  assert.ok(registry.get('infuse-now-playing-card').getConfigElement);
  assert.match(warnings[0][0], /Update Infuse Now Playing to v0\.2\.11\+/);
});

test('bridge does not overwrite a previously registered modern resource', async () => {
  const registry = fakeBrowser();
  const existing = class ModernAlreadyLoaded {static origin = 'bundled';};
  const elementNames = [
    'infuse-now-playing-card', 'infuse-household-card',
    'infuse-now-playing-card-editor', 'infuse-household-card-editor',
  ];
  for (const name of elementNames) registry.set(name, existing);
  window.customCards.push({type:'infuse-now-playing-card'}, {type:'infuse-household-card'});
  const original = console.warn;
  console.warn = () => {};
  try {
    await runShim('throw new Error("Temporary connection failure")');
  } finally {
    console.warn = original;
  }
  assertRegistered(registry);
  for (const name of elementNames) assert.equal(registry.get(name), existing);
});

test('legacy release neither changes HA dashboard resources nor uninstalls HACS plugin', () => {
  assert.doesNotMatch(source, /hass\.callWS|\.async_delete_item|\.deleteResource|fetch\(.+DELETE|\.removeItem\(/);
  assert.match(source, /try \{\s+await import\(/);
  assert.match(source, /catch \(error\) \{/);
  assert.ok(source.includes('class InfuseNowPlayingCard extends HTMLElement'));
  assert.ok(source.includes('class InfuseHouseholdCard extends HTMLElement'));
});
