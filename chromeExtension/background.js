/* v0.1
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
*/
let panelState = {}; // Track panel state per window

chrome.action.onClicked.addListener((tab) => {
  const windowId = tab.windowId;

  // Initialize state for this window if not exists
  if (!panelState[windowId]) {
    panelState[windowId] = { isOpen: false };
  }

  if (panelState[windowId].isOpen) {
    // Hide the side panel by disabling it
    chrome.sidePanel.setOptions({ enabled: false });
    panelState[windowId].isOpen = false;
  } else {
    // Ensure the side panel is enabled and set to the correct path
    chrome.sidePanel.setOptions({ enabled: true, path: 'sidepanel.html' });
    // Open the side panel directly in response to the click
    chrome.sidePanel.open({ windowId });
    panelState[windowId].isOpen = true;
  }
});

// Clean up state when window is removed
chrome.windows.onRemoved.addListener((windowId) => {
  delete panelState[windowId];
});