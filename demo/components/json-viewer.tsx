import { Highlight, themes } from 'prism-react-renderer';

type CodeViewerProps = {
  code: string;
  language: string;
  className?: string;
};

export function CodeViewer({
  code,
  language,
  className = 'payload',
}: CodeViewerProps) {
  return (
    <Highlight theme={themes.github} code={code} language={language}>
      {({ className: highlightClass, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${className} code-block ${highlightClass}`} style={style}>
          {tokens.map((line, lineIndex) => (
            <div key={lineIndex} {...getLineProps({ line })}>
              {line.map((token, tokenIndex) => (
                <span key={tokenIndex} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

type JsonViewerProps = {
  value: unknown;
  emptyMessage?: string;
  className?: string;
};

export function JsonViewer({
  value,
  emptyMessage = 'No data',
  className = 'payload',
}: JsonViewerProps) {
  if (value == null) {
    return <pre className={`${className} empty-payload`}>{emptyMessage}</pre>;
  }

  return (
    <CodeViewer
      code={JSON.stringify(value, null, 2)}
      language="json"
      className={className}
    />
  );
}
