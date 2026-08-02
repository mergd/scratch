import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cookie } from '@phosphor-icons/react';
import { ScratchFeedback } from '@fldr/scratch';
import {
  ConfigForm,
  type PlaygroundConfig,
} from './components/config-form';
import { CodeViewer, JsonViewer } from './components/json-viewer';

function resetGuideCookie() {
  document.cookie = 'fldr_scratch_hide_guide=; path=/; max-age=0';
  window.location.reload();
}

type FeedbackStoreResponse = {
  payload: unknown;
};

const DEFAULT_CONFIG: PlaygroundConfig = {
  primaryColor: 'blue',
  enableCopy: true,
  enableMailFeedback: true,
  isDevelopment: true,
  feedbackUrl: '/api/feedback',
  mailto: '',
  webhookUrl: '',
  feedbackUserId: 'demo-user',
  feedbackPlan: 'pro',
  guideTitle: '',
  guideBody: '',
  idleTimeoutMs: 30_000,
};

export function App() {
  const [lastPayload, setLastPayload] = useState<unknown>(null);
  const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_CONFIG);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const refreshPayload = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback');
      if (!response.ok) return;
      const data = (await response.json()) as FeedbackStoreResponse;
      setLastPayload(data.payload);
    } catch {
      /* demo server may be restarting */
    }
  }, []);

  useEffect(() => {
    void refreshPayload();
    const id = window.setInterval(() => {
      void refreshPayload();
    }, 2000);
    return () => window.clearInterval(id);
  }, [refreshPayload]);

  const feedbackContext = useMemo(
    () => ({
      userId: config.feedbackUserId || undefined,
      plan: config.feedbackPlan || undefined,
    }),
    [config.feedbackUserId, config.feedbackPlan],
  );

  const guide = useMemo(() => {
    if (!config.guideTitle && !config.guideBody) return undefined;
    return {
      ...(config.guideTitle ? { title: config.guideTitle } : {}),
      ...(config.guideBody ? { body: config.guideBody } : {}),
    };
  }, [config.guideTitle, config.guideBody]);

  const resolvedIdleTimeoutMs: number | false =
    config.idleTimeoutMs === 0 ? false : config.idleTimeoutMs;

  const configSnippet = useMemo(() => {
    const props: Record<string, unknown> = {
      primaryColor: config.primaryColor,
      enableCopy: config.enableCopy,
      enableMailFeedback: config.enableMailFeedback,
    };

    if (config.isDevelopment) props.isDevelopment = true;
    if (resolvedIdleTimeoutMs !== 30_000) {
      props.idleTimeoutMs = resolvedIdleTimeoutMs;
    }
    if (config.feedbackUrl) props.feedbackUrl = config.feedbackUrl;
    if (config.mailto) props.mailto = config.mailto;
    if (config.webhookUrl) props.webhookUrl = config.webhookUrl;
    if (config.feedbackUserId || config.feedbackPlan) {
      props.feedbackContext = feedbackContext;
    }
    if (guide) props.guide = guide;

    const lines = Object.entries(props).map(([key, value]) => {
      const serialized =
        typeof value === 'string'
          ? `"${value}"`
          : JSON.stringify(value, null, 2)
              .split('\n')
              .map((line, index) => (index === 0 ? line : `  ${line}`))
              .join('\n');
      return `  ${key}={${serialized}}`;
    });

    return `<ScratchFeedback\n${lines.join('\n')}\n/>`;
  }, [config, feedbackContext, guide, resolvedIdleTimeoutMs]);

  const updateConfig = <K extends keyof PlaygroundConfig>(
    key: K,
    value: PlaygroundConfig[K],
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="page">
      <main>
        <p className="eyebrow">@fldr/scratch</p>
        <h1>Playground</h1>
        <p className="lede">
          Always-on (dev) is enabled by default so the toolbar is visible.
          Turn it off to try unlock with three circles or{' '}
          <kbd>⌘/Ctrl+Shift+U</kbd>. Tweak props below, annotate, then send.
        </p>

        <section className="config-section">
          <h2>Live config</h2>
          <ConfigForm
            config={config}
            showAdvanced={showAdvanced}
            onShowAdvancedChange={setShowAdvanced}
            onChange={updateConfig}
          />

          <h3>Effective snippet</h3>
          <CodeViewer
            code={configSnippet}
            language="tsx"
            className="payload config-snippet"
          />
        </section>

        <section>
          <h2>Sample copy</h2>
          <p>
            Use this block as a target. The primary action is a bit
            underweighted, the heading scale is tight on small screens, and the
            secondary text competes with the title.
          </p>
          <div className="actions">
            <button type="button">Continue</button>
            <button type="button" className="secondary">
              Not now
            </button>
          </div>
        </section>

        <section>
          <h2>Last feedback payload</h2>
          <p>
            Demo endpoint <code>POST /api/feedback</code> stores the most recent
            send body. Polls every 2s.
          </p>
          <JsonViewer
            value={lastPayload}
            emptyMessage="No payload yet — annotate something, then Send feedback."
          />
          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() => void refreshPayload()}
            >
              Refresh now
            </button>
            <button
              type="button"
              className="secondary icon-button"
              onClick={resetGuideCookie}
            >
              <Cookie size={14} weight="regular" aria-hidden />
              Reset guide cookie
            </button>
          </div>
        </section>
      </main>

      <ScratchFeedback
        key={config.isDevelopment ? 'dev' : 'prod'}
        isDevelopment={config.isDevelopment}
        idleTimeoutMs={resolvedIdleTimeoutMs}
        primaryColor={config.primaryColor}
        enableCopy={config.enableCopy}
        enableMailFeedback={config.enableMailFeedback}
        feedbackUrl={config.feedbackUrl || undefined}
        mailto={config.mailto || undefined}
        webhookUrl={config.webhookUrl || undefined}
        feedbackContext={feedbackContext}
        guide={guide}
      />
    </div>
  );
}
