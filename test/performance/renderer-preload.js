const electronCommonIPCModule = require('../../lib/electron-common-ipc');
electronCommonIPCModule.PreloadElectronCommonIPC();

console.log(`IsElectronCommonIPCAvailable=${electronCommonIPCModule.IsElectronCommonIPCAvailable()}`);

const electron = require('electron');
window.ipcRenderer = electron.ipcRenderer;

