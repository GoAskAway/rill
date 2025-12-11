// Worker script stub for WorkerQuickJSProvider
// Implementors should create a Worker from this script and wire to a QuickJS runtime inside the worker.
// If quickjs-emscripten is available, you can import it here and create a runtime/context accordingly.

self.onmessage = async (ev) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'init':
      // TODO: initialize QuickJS runtime in worker
      // Example (pseudo):
      // const rt = QuickJS.createRuntime();
      // const ctx = rt.createContext();
      // self.__qjs = { rt, ctx };
      break;
    case 'setGlobal':
      // TODO: set globals in QuickJS context
      // Example: self.__qjs?.ctx.setGlobal(msg.name, msg.value)
      break;
    case 'eval':
      try {
        // TODO: eval code in QuickJS context
        postMessage({ type: 'result', id: msg.id, result: null });
      } catch (e) {
        postMessage({ type: 'error', id: msg.id, error: String(e && e.message || e) });
      }
      break;
    case 'dispose':
      // TODO: dispose QuickJS context/runtime
      close();
      break;
  }
};
