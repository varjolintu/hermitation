'use strict';

let settings = {};
const defaultSettings = {};
defaultSettings.enabled = true;
defaultSettings.remember = 'remember';
defaultSettings.whitelist = [];

var loadSettings = async function() {
    try {
        const stored = await browser.storage.local.get({ 'settings': {} });
        return stored.settings;
    } catch (err) {
        console.log(`Cannot load settings: ${err}`);
    }

    return {};
};

(async function() {
    settings = await loadSettings();
    if (Object.keys(settings).length === 0) {
        settings = defaultSettings;
        browser.storage.local.set({ 'settings': settings });
    }

    if (settings.remember === 'enabled') {
        settings.enabled = true;
    } else if (settings.remember === 'disabled') {
        settings.enabled = false;
    }

    updateIcon(settings.enabled);
})();

browser.browserAction.onClicked.addListener(() => changeState(!settings.enabled));
browser.runtime.onMessage.addListener(onMessage);
browser.tabs.onActivated.addListener(onTabChange);
browser.webNavigation.onBeforeNavigate.addListener(onNavigate);

function changeState(state, save = true) {
    if (browser.privacy.websites.firstPartyIsolate.set({ value: state })) {
        if (save) {
            settings.enabled = state;
            browser.storage.local.set({ 'settings': settings });
        }
        updateIcon(state);
    }
}

function updateIcon(state) {
    browser.browserAction.setIcon({ path: state ? 'hermitation.svg' : 'hermitation_inactive.svg' });
}

async function onMessage(msg) {
    if (msg.action === 'load_settings') {
        return loadSettings();
    } else if (msg.action === 'reload_settings') {
        settings = await loadSettings();
    }

    return {};
}

async function onTabChange(details) {
    const tabInfo = await browser.tabs.get(details.tabId);
    if (tabInfo) {
        changeState(siteWhitelisted(tabInfo.url) ? false : settings.enabled, false);
    }
}

async function onNavigate(details) {
    changeState(siteWhitelisted(details.url) ? false : settings.enabled, false);
}

function siteWhitelisted(url) {
    return settings.whitelist.some(e => url.includes(e));
}
