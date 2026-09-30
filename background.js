// Click en el ícono: abre la pestaña de la extensión, o la enfoca si ya está abierta
const APP_URL = chrome.runtime.getURL('app.html');

chrome.action.onClicked.addListener(async () => {
    const [ctx] = await chrome.runtime.getContexts({ contextTypes: ['TAB'], documentUrls: [APP_URL] });
    if (ctx && ctx.tabId >= 0) {
        await chrome.tabs.update(ctx.tabId, { active: true });
        await chrome.windows.update(ctx.windowId, { focused: true });
    } else {
        await chrome.tabs.create({ url: APP_URL });
    }
});
