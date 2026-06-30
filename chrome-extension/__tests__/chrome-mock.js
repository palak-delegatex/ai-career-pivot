export function createChromeMock() {
  const storage = { local: {}, sync: {} };

  return {
    runtime: {
      sendMessage: vi.fn((msg, cb) => cb?.({ ok: true, data: null })),
      onMessage: { addListener: vi.fn() },
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() },
      openOptionsPage: vi.fn(),
      getRedirectURL: vi.fn(() => "https://redirect.chromiumapp.org/"),
    },
    storage: {
      local: {
        get: vi.fn(async (keys) => {
          if (typeof keys === "string") return { [keys]: storage.local[keys] };
          const result = {};
          for (const k of Array.isArray(keys) ? keys : Object.keys(keys)) {
            result[k] = storage.local[k];
          }
          return result;
        }),
        set: vi.fn(async (obj) => Object.assign(storage.local, obj)),
        remove: vi.fn(async (key) => delete storage.local[key]),
      },
      sync: {
        get: vi.fn(async (keys) => {
          if (typeof keys === "string") return { [keys]: storage.sync[keys] };
          const result = {};
          for (const k of Array.isArray(keys) ? keys : Object.keys(keys)) {
            result[k] = storage.sync[k];
          }
          return result;
        }),
        set: vi.fn(async (obj) => Object.assign(storage.sync, obj)),
        remove: vi.fn(async (key) => delete storage.sync[key]),
      },
      session: {
        get: vi.fn(async () => ({})),
      },
    },
    alarms: {
      create: vi.fn(),
      clear: vi.fn(),
      onAlarm: { addListener: vi.fn() },
    },
    tabs: {
      create: vi.fn(),
      query: vi.fn(async () => [{ id: 1, url: "https://example.com" }]),
      sendMessage: vi.fn(),
    },
    scripting: {
      executeScript: vi.fn(async () => [{ result: null }]),
    },
    commands: {
      onCommand: { addListener: vi.fn() },
    },
    identity: {
      launchWebAuthFlow: vi.fn(),
      getRedirectURL: vi.fn(() => "https://redirect.chromiumapp.org/"),
    },
    _storage: storage,
  };
}
