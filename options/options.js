/*global browser */
function saveOptions(e) {
  let maxTabs = document.getElementById("max-tabs").value;
  let includePinned = document.getElementById("include-pinned").checked;
  let showNotifications = document.getElementById("show-notifications").checked;
  browser.storage.sync.set({
    maxTabs: maxTabs,
    includePinned: includePinned,
    showNotifications: showNotifications,
  });
  e.preventDefault();
}

function restoreOptions() {
  var gettingItem = browser.storage.sync.get({
    maxTabs: 10,
    includePinned: false,
    showNotifications: true,
  });
  gettingItem.then((res) => {
    document.getElementById("max-tabs").value = res.maxTabs;
    document.getElementById("include-pinned").checked = res.includePinned;
    document.getElementById("show-notifications").checked = res.showNotifications;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
