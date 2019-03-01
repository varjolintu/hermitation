'use strict';

const textArea = document.getElementById('whitelist');

async function updateSettings(setting, value) {
    const settings = await browser.runtime.sendMessage({ action: 'load_settings' });
    if (settings) {
        settings[setting] = value;
        browser.storage.local.set({ 'settings': settings });
        browser.runtime.sendMessage({ action: 'reload_settings' });
    }
}

async function selectionChanged(e) {
    updateSettings('remember', e.currentTarget.value);
}

async function buttonPressed() {
    const whitelist = textArea.value.split('\n').filter(e => e);
    updateSettings('whitelist', whitelist);
}

(async function() {
    try {
        const settings = await browser.runtime.sendMessage({ action: 'load_settings' });
        document.getElementById('remember').value = settings.remember || 'remember';
        textArea.value = '';
        for (const item of settings.whitelist) {
            textArea.value += item + '\n';
        }
    } catch (err) {
        console.log(`Cannot load settings: ${err}`);
    }

    document.getElementById('remember').addEventListener('change', selectionChanged);
    document.getElementById('saveButton').addEventListener('click', buttonPressed);
})();
