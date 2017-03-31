import 'source-map-support/register';
import fs from 'fs';
import path from 'path';
import {app, crashReporter} from 'electron';
import createLoginWindow from './components/login/loginWindow';
import createMainWindow from './components/mainWindow/mainWindow';
import helpers from './helpers/helpers';
import inferFlash from './helpers/inferFlash';
import electronDownload from 'electron-dl';

// this should be placed at top of main.js to handle setup events quickly
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = 'Coar.exe'

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
}

if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
} else {
  const {isOSX} = helpers;

  electronDownload();

  const APP_ARGS_FILE_PATH = path.join(__dirname, '..', 'nativefier.json');
  const appArgs = JSON.parse(fs.readFileSync(APP_ARGS_FILE_PATH, 'utf8'));

  let mainWindow;

  if (typeof appArgs.flashPluginDir === 'string') {
    app.commandLine.appendSwitch('ppapi-flash-path', appArgs.flashPluginDir);
  } else if (appArgs.flashPluginDir) {
    const flashPath = inferFlash();
    app.commandLine.appendSwitch('ppapi-flash-path', flashPath);
  }

  if (appArgs.ignoreCertificate) {
    app.commandLine.appendSwitch('ignore-certificate-errors');
  }

  // do nothing for setDockBadge if not OSX
  let setDockBadge = () => {};

  if (isOSX()) {
    setDockBadge = app.dock.setBadge;
  }

  app.on('window-all-closed', () => {
    if (!isOSX() || appArgs.fastQuit) {
      app.quit();
    }
  });

  app.on('activate', (event, hasVisibleWindows) => {
    if (isOSX()) {
      // this is called when the dock is clicked
      if (!hasVisibleWindows) {
        mainWindow.show();
      }
    }
  });

  app.on('before-quit', () => {
    // not fired when the close button on the window is clicked
    if (isOSX()) {
      // need to force a quit as a workaround here to simulate the osx app hiding behaviour
      // Somehow sokution at https://github.com/atom/electron/issues/444#issuecomment-76492576 does not work,
      // e.prevent default appears to persist

      // might cause issues in the future as before-quit and will-quit events are not called
      app.exit(0);
    }
  });

  if (appArgs.crashReporter) {
    app.on('will-finish-launching', () => {
      crashReporter.start({
        productName: appArgs.name,
        submitURL: appArgs.crashReporter,
        autoSubmit: true
      });
    });
  }

  app.on('ready', () => {
    mainWindow = createMainWindow(appArgs, app.quit, setDockBadge);
  });

  app.on('login', (event, webContents, request, authInfo, callback) => {
    // for http authentication
    event.preventDefault();
    createLoginWindow(callback);
  });
}
