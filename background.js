// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/*global browser, chroma */
let title = browser.i18n.getMessage('title');
let maxTabs = 10;
let includePinned = false;
let includeAllWindows = false;
let colorScale = chroma.scale(['#A6A6A6', '#B90000']);

function updatePrefs() {
  return new Promise((resolve, reject) => {
    browser.storage.sync.get({
      "maxTabs": 10,
      "includePinned": false,
      "includeAllWindows": false
    }, items => {
      maxTabs = items.maxTabs;
      includePinned = items.includePinned;
      includeAllWindows = items.includeAllWindows;
      resolve();
    });
  });
}

function updateButton(numTabs) {
  browser.browserAction.setTitle({
    title: title + ' - ' + numTabs + '/' + maxTabs
  });
  browser.browserAction.setBadgeText({
    text: numTabs > 99 ? '99+' : numTabs.toString()
  });
  browser.browserAction.setBadgeBackgroundColor({
    color: colorScale(numTabs/maxTabs).hex()
  });
}

async function queryNumTabs() {
  let tabs = await browser.tabs.query({
    currentWindow: includeAllWindows ? null : true,
    pinned: includePinned ? null : false
  });
  return tabs.length;
}

browser.tabs.onCreated.addListener(tab => {
  if (browser.windows.get(tab.windowId).focused) {
    // We only care about the current window
    return;
  }
  if (tab.id != browser.tabs.TAB_ID_NONE) {
    queryNumTabs().then(numTabs => {
      if (numTabs > maxTabs) {
        browser.tabs.remove(tab.id).then(() => {
          browser.notifications.create("", {
            type: "basic",
            title: title,
            message: browser.i18n.getMessage('notOpenMaxTabs', maxTabs)
          });
        });
      } else {
        updateButton(numTabs);
      }
    });
  }
});

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (removeInfo.isWindowClosing) {
    return;
  }
  queryNumTabs().then(updateButton);
});

browser.tabs.onDetached.addListener((tabId, detachInfo) => {
  if (browser.windows.get(detachInfo.oldWindowId).focused) {
    queryNumTabs().then(updateButton);
  }
});

browser.tabs.onAttached.addListener((tabId, attachInfo) => {
  if (browser.windows.get(attachInfo.oldWindowId).focused) {
    queryNumTabs().then(updateButton);
  }
});

const filter = {
  properties: ["pinned"]
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  queryNumTabs().then(updateButton);
}, filter);

browser.windows.onFocusChanged.addListener(windowId => {
  queryNumTabs().then(updateButton);
});

browser.storage.onChanged.addListener((changes, areaName) => {
  updatePrefs().then(() => {
    queryNumTabs().then(updateButton);
  });
});

browser.browserAction.disable();
updatePrefs().then(() => {
  queryNumTabs().then(updateButton);
});
