import type {Theme} from '../definitions';
import {logInfo, logWarn} from './utils/log';

declare const __FIREFOX_MV2__: boolean;

const NATIVE_HOST_NAME = 'darkreader_matugen';
const STORAGE_KEY = 'matugen-integration-enabled';
const RECONNECT_DELAY = 5000;

type ThemeChangeCallback = (theme: Partial<Theme>) => void;

export default class MatugenIntegration {
    private static port: chrome.runtime.Port | null = null;
    private static enabled = false;
    private static connected = false;
    private static reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private static onThemeChange: ThemeChangeCallback | null = null;

    static init(themeCallback: ThemeChangeCallback): void {
        MatugenIntegration.onThemeChange = themeCallback;

        if (!__FIREFOX_MV2__) {
            return;
        }

        chrome.storage.local.get(STORAGE_KEY, (result: Record<string, unknown>) => {
            MatugenIntegration.enabled = result[STORAGE_KEY] as boolean ?? false;
            if (MatugenIntegration.enabled) {
                MatugenIntegration.connect();
            }
        });

        chrome.storage.onChanged.addListener((changes: Record<string, chrome.storage.StorageChange>, area: string) => {
            if (area !== 'local' || !(STORAGE_KEY in changes)) {
                return;
            }
            const newValue = changes[STORAGE_KEY].newValue ?? false;
            if (newValue && !MatugenIntegration.enabled) {
                MatugenIntegration.enabled = true;
                MatugenIntegration.connect();
            } else if (!newValue && MatugenIntegration.enabled) {
                MatugenIntegration.enabled = false;
                MatugenIntegration.disconnect();
            }
        });
    }

    static async setEnabled(enabled: boolean): Promise<void> {
        await chrome.storage.local.set({[STORAGE_KEY]: enabled});
    }

    static isEnabled(): boolean {
        return MatugenIntegration.enabled;
    }

    static isConnected(): boolean {
        return MatugenIntegration.connected;
    }

    private static connect(): void {
        if (MatugenIntegration.port) {
            return;
        }

        if (MatugenIntegration.reconnectTimer) {
            clearTimeout(MatugenIntegration.reconnectTimer);
            MatugenIntegration.reconnectTimer = null;
        }

        try {
            const port = chrome.runtime.connectNative(NATIVE_HOST_NAME);
            MatugenIntegration.port = port;
            MatugenIntegration.connected = true;

            port.onMessage.addListener(MatugenIntegration.onMessage);
            port.onDisconnect.addListener(MatugenIntegration.onDisconnect);

            logInfo('matugen: native host connected');
        } catch (err) {
            logWarn('matugen: failed to connect to native host:', err);
            MatugenIntegration.scheduleReconnect();
        }
    }

    private static disconnect(): void {
        if (MatugenIntegration.reconnectTimer) {
            clearTimeout(MatugenIntegration.reconnectTimer);
            MatugenIntegration.reconnectTimer = null;
        }
        if (MatugenIntegration.port) {
            MatugenIntegration.port.disconnect();
            MatugenIntegration.port = null;
        }
        MatugenIntegration.connected = false;
    }

    private static scheduleReconnect(): void {
        if (MatugenIntegration.reconnectTimer) {
            return;
        }
        MatugenIntegration.reconnectTimer = setTimeout(() => {
            MatugenIntegration.reconnectTimer = null;
            if (MatugenIntegration.enabled) {
                MatugenIntegration.connect();
            }
        }, RECONNECT_DELAY);
    }

    private static onDisconnect(_port: chrome.runtime.Port): void {
        MatugenIntegration.port = null;
        MatugenIntegration.connected = false;

        const error = chrome.runtime.lastError;
        if (error) {
            logWarn('matugen: host disconnected:', error.message);
        } else {
            logInfo('matugen: host disconnected');
        }

        if (MatugenIntegration.enabled) {
            MatugenIntegration.scheduleReconnect();
        }
    }

    private static onMessage(message: unknown): void {
        if (!message || typeof message !== 'object') {
            return;
        }

        const msg = message as Record<string, unknown>;
        if (msg.type === 'matugen-update') {
            const settings = msg.settings as Record<string, unknown> | undefined;
            if (settings?.theme) {
                const theme = settings.theme as Partial<Theme>;
                logInfo('matugen: applying theme update');
                MatugenIntegration.onThemeChange?.(theme);
            }
        } else if (msg.type === 'error') {
            logWarn('matugen: host error:', msg.message);
        }
    }

    static refresh(): void {
        if (MatugenIntegration.port) {
            try {
                MatugenIntegration.port.postMessage({type: 'refresh'});
            } catch {
                // Port may be disconnected
            }
        }
    }
}
