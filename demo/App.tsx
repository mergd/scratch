import { AgentationFeedback } from '@fldr/agentation';

export function App() {
  return (
    <div className="page">
      <main>
        <p className="eyebrow">@fldr/agentation</p>
        <h1>Playground</h1>
        <p className="lede">
          Toolbar is on in this playground. Click something and leave a note.
          In production apps, unlock with three circles or <kbd>⌘</kbd>
          <kbd>⇧</kbd>
          <kbd>U</kbd>.
        </p>

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
      </main>

      <AgentationFeedback isDevelopment={import.meta.env.DEV} />
    </div>
  );
}
