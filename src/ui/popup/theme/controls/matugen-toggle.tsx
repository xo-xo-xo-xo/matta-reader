import {m} from 'malevic';
import {getContext} from 'malevic/dom';

import ThemeControl from './theme-control';

const STORAGE_KEY = 'matugen-integration-enabled';

interface MatugenToggleStore {
    enabled: boolean;
    loaded: boolean;
}

export default function MatugenToggle() {
    const context = getContext();
    const store: MatugenToggleStore = context.store;
    if (!store.loaded) {
        store.loaded = true;
        store.enabled = false;
        chrome.storage.local.get(STORAGE_KEY, (result: Record<string, unknown>) => {
            store.enabled = result[STORAGE_KEY] as boolean ?? false;
            context.refresh();
        });
    }

    function toggle() {
        store.enabled = !store.enabled;
        chrome.storage.local.set({[STORAGE_KEY]: store.enabled});
        context.refresh();
    }

    const label = store.enabled ? 'On' : 'Off';

    return (
        <ThemeControl label="Matugen sync">
            <span class="matugen-toggle" onclick={toggle}>
                <span class={`matugen-toggle__switch ${store.enabled ? 'matugen-toggle__switch--on' : ''}`}>
                    <span class="matugen-toggle__knob" />
                </span>
                <span class="matugen-toggle__label">{label}</span>
            </span>
        </ThemeControl>
    );
}
