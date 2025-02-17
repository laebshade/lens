/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { autoUpdater, UpdateInfo } from "electron-updater";
import logger from "./logger";
import { isDevelopment, isLinux, isMac, isPublishConfigured, isTestEnv } from "../common/vars";
import { delay } from "../common/utils";
import { areArgsUpdateAvailableToBackchannel, AutoUpdateLogPrefix, broadcastMessage, onceCorrect, UpdateAvailableChannel, UpdateAvailableToBackchannel } from "../common/ipc";
import { once } from "lodash";
import { ipcMain } from "electron";
import { nextUpdateChannel } from "./utils/update-channel";
import { UserStore } from "../common/user-store";
import { autoUpdater as electronAutoUpdater } from "electron";

let installVersion: null | string = null;

export function isAutoUpdateEnabled() {
  return autoUpdater.isUpdaterActive() && isPublishConfigured;
}

function handleAutoUpdateBackChannel(event: Electron.IpcMainEvent, ...[arg]: UpdateAvailableToBackchannel) {
  if (arg.doUpdate) {
    if (arg.now) {
      logger.info(`${AutoUpdateLogPrefix}: User chose to update now`);
      setImmediate(() => {
        if (isMac) {
          /**
           * This is a necessary workaround until electron-updater is fixed.
           * The problem is that it downloads it but then never tries to
           * download it from itself via electron.
           */
          electronAutoUpdater.checkForUpdates();
        } else if (isLinux) {
          /**
           * This is a necessary workaround until electron-updater is fixed.
           * The problem is that because linux updating is not implemented at
           * all via electron. Electron's autoUpdater.quitAndInstall() is never
           * called.
           */
          electronAutoUpdater.emit("before-quit-for-update");
        }
        autoUpdater.quitAndInstall(true, true);
      });
    } else {
      logger.info(`${AutoUpdateLogPrefix}: User chose to update on quit`);
      autoUpdater.autoInstallOnAppQuit = true;
    }
  } else {
    logger.info(`${AutoUpdateLogPrefix}: User chose not to update`);
  }
}

/**
 * starts the automatic update checking
 * @param interval milliseconds between interval to check on, defaults to 24h
 */
export const startUpdateChecking = once(function (interval = 1000 * 60 * 60 * 24): void {
  if (isDevelopment || isTestEnv) {
    return;
  }

  const userStore = UserStore.getInstance();

  autoUpdater.logger = {
    info: message => logger.info(`[AUTO-UPDATE]: electron-updater: ${message}`),
    warn: message => logger.warn(`[AUTO-UPDATE]: electron-updater: ${message}`),
    error: message => logger.error(`[AUTO-UPDATE]: electron-updater: ${message}`),
    debug: message =>  logger.debug(`[AUTO-UPDATE]: electron-updater: ${message}`),
  };
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.channel = userStore.updateChannel;
  autoUpdater.allowDowngrade = userStore.isAllowedToDowngrade;

  autoUpdater
    .on("update-available", (info: UpdateInfo) => {
      if (autoUpdater.autoInstallOnAppQuit) {
        // a previous auto-update loop was completed with YES+LATER, check if same version
        if (installVersion === info.version) {
          // same version, don't broadcast
          return;
        }
      }

      /**
       * This should be always set to false here because it is the reasonable
       * default. Namely, if a don't auto update to a version that the user
       * didn't ask for.
       */
      autoUpdater.autoInstallOnAppQuit = false;
      installVersion = info.version;

      autoUpdater.downloadUpdate()
        .catch(error => logger.error(`${AutoUpdateLogPrefix}: failed to download update`, { error: String(error) }));
    })
    .on("update-downloaded", (info: UpdateInfo) => {
      try {
        const backchannel = `auto-update:${info.version}`;

        ipcMain.removeAllListeners(backchannel); // only one handler should be present

        // make sure that the handler is in place before broadcasting (prevent race-condition)
        onceCorrect({
          source: ipcMain,
          channel: backchannel,
          listener: handleAutoUpdateBackChannel,
          verifier: areArgsUpdateAvailableToBackchannel,
        });
        logger.info(`${AutoUpdateLogPrefix}: broadcasting update available`, { backchannel, version: info.version });
        broadcastMessage(UpdateAvailableChannel, backchannel, info);
      } catch (error) {
        logger.error(`${AutoUpdateLogPrefix}: broadcasting failed`, { error });
        installVersion = undefined;
      }
    })
    .on("update-not-available", () => {
      const nextChannel = nextUpdateChannel(userStore.updateChannel, autoUpdater.channel);

      logger.info(`${AutoUpdateLogPrefix}: update not available from ${autoUpdater.channel}, will check ${nextChannel} channel next`);

      autoUpdater.channel = nextChannel;
    });

  async function helper() {
    while (true) {
      await checkForUpdates();
      await delay(interval);
    }
  }

  helper();
});

export async function checkForUpdates(): Promise<void> {
  const userStore = UserStore.getInstance();

  try {
    logger.info(`📡 Checking for app updates`);

    autoUpdater.channel = userStore.updateChannel;
    autoUpdater.allowDowngrade = userStore.isAllowedToDowngrade;
    await autoUpdater.checkForUpdates();
  } catch (error) {
    logger.error(`${AutoUpdateLogPrefix}: failed with an error`, { error: String(error) });
  }
}
