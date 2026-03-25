import {
  useCallback, useEffect, useRef, useState
} from 'react';

import { type ExternalFilePayload } from '../types';

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: Record<string, unknown>) => Promise<void>;
        getToken: () => { access_token: string } | null;
      };
    };
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
            }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        ViewId: { DOCS: string };
        Action: { PICKED: string; CANCEL: string };
        Feature: { MULTISELECT_ENABLED: string };
      };
    };
  }
}

interface GooglePickerBuilder {
  addView: (view: string) => GooglePickerBuilder;
  enableFeature: (feature: string) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId: (appId: string) => GooglePickerBuilder;
  setCallback: (
    callback: (data: GooglePickerResponse) => void
  ) => GooglePickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
}

interface GooglePickerResponse {
  action: string;
  docs?: Array<{
    id: string;
    name: string;
    mimeType: string;
    url: string;
    sizeBytes?: number;
    iconUrl?: string;
  }>;
}

export interface GoogleDrivePickerConfig {
  /** Google OAuth2 Client ID */
  clientId: string;
  /** Google API key for the Picker API */
  apiKey: string;
  /** Google Cloud project / app ID (optional) */
  appId?: string;
}

const GAPI_URL = 'https://apis.google.com/js/api.js';
const GSI_URL = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();

      return;
    }
    const script = document.createElement('script');

    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}

export function useGoogleDrivePicker(config?: GoogleDrivePickerConfig) {
  const [isReady, setIsReady] = useState(false);
  const accessTokenRef = useRef<string | null>(null);
  const clientId = config?.clientId;
  const apiKey = config?.apiKey;
  const appId = config?.appId;
  const isAvailable = !!(clientId && apiKey);

  useEffect(() => {
    if (!isAvailable) return;
    let cancelled = false;

    async function init() {
      await Promise.all([loadScript(GAPI_URL), loadScript(GSI_URL)]);
      await new Promise<void>((resolve) => {
        window.gapi?.load('picker', resolve);
      });
      if (!cancelled) setIsReady(true);
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [isAvailable]);

  const openPicker = useCallback(
    ({ multiSelect = true }: { multiSelect?: boolean } = {}) => {
      return new Promise<Array<ExternalFilePayload>>((resolve, reject) => {
        const { google, gapi } = window;

        if (
          !google
          || !gapi
          || !clientId
          || !apiKey
        ) {
          reject(new Error('Google Drive picker not available'));

          return;
        }

        const showPicker = (token: string) => {
          const { picker } = google;
          let builder = new picker.PickerBuilder()
            .addView(picker.ViewId.DOCS)
            .setOAuthToken(token)
            .setDeveloperKey(apiKey)
            .setCallback((data: GooglePickerResponse) => {
              if (data.action === picker.Action.PICKED && data.docs) {
                const files: Array<ExternalFilePayload> = data.docs.map(
                  doc => ({
                    source: 'google_drive' as const,
                    file_name: doc.name,
                    file_type: doc.mimeType || 'application/octet-stream',
                    signed_url: doc.url,
                    file_data: doc as unknown as Record<string, unknown>
                  })
                );

                resolve(files);
              } else if (data.action === picker.Action.CANCEL) {
                resolve([]);
              }
            });

          if (appId) {
            builder = builder.setAppId(appId);
          }
          if (multiSelect) {
            builder = builder.enableFeature(picker.Feature.MULTISELECT_ENABLED);
          }

          builder.build().setVisible(true);
        };

        const existingToken = accessTokenRef.current;

        if (existingToken) {
          showPicker(existingToken);

          return;
        }

        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPE,
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error));

              return;
            }
            if (response.access_token) {
              accessTokenRef.current = response.access_token;
              showPicker(response.access_token);
            }
          }
        });

        tokenClient.requestAccessToken();
      });
    },
    [clientId, apiKey, appId]
  );

  return { openPicker, isAvailable, isReady: isAvailable && isReady };
}