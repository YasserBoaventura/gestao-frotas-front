(window as any).global = window;


// Para resolver outros possíveis problemas de Node.js
(window as any).process = {
  env: { DEBUG: undefined },
  version: ''
};
