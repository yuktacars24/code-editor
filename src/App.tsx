import Editor from "@monaco-editor/react";
import React, { useState, useRef } from "react";
import * as monaco from "monaco-editor"; // ✅ for typings

import "./App.css";

const snippets: Record<"javascript" | "json", string> = {
  javascript: `console.log("Try JS Editor");`,
  json: `{
  "name": "Your name",
  "age": 25
}`,
};

const App: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [language, setLanguage] = useState<"javascript" | "json">("javascript");
  const [snippet, setSnippet] = useState(snippets["javascript"]);
  const [theme, setTheme] = useState<"vs-light" | "vs-dark">("vs-light");

  const handleLanguageChange = (lang: "javascript" | "json") => {
    setLanguage(lang);
    setSnippet(snippets[lang]);
  };

  function handleEditorDidMount(
    editor: import("monaco-editor").editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor")
  ) {
    editorRef.current = editor;

    // ✅ 1. Keep standard JS setup
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      checkJs: true,
    });

    // ✅ 2. Your allowed tokens
    const definedTokens = ["alpha_numeric", "username", "user_id"];

    // ✅ 3. Autocomplete for `{{`
    monaco.languages.registerCompletionItemProvider("javascript", {
      triggerCharacters: ["{"],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        if (!textUntilPosition.endsWith("{{")) return { suggestions: [] };

        const suggestions: monaco.languages.CompletionItem[] =
          definedTokens.map((token) => ({
            label: token,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: token,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          }));

        return { suggestions };
      },
    });

    // ✅ 4. Validation for incorrect tokens
    const model = editor.getModel();
    if (!model) return;

    const validateTokens = () => {
      const code = model.getValue();
      const matches = [...code.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)];

      const markers: monaco.editor.IMarkerData[] = matches
        .filter((match) => !definedTokens.includes(match[1]))
        .map((match) => {
          const token = match[1];
          const startIndex = match.index || 0;
          const beforeText = code.slice(0, startIndex);
          const lines = beforeText.split("\n");
          const lineNumber = lines.length;
          const column = lines[lines.length - 1].length + 1;

          return {
            severity: monaco.MarkerSeverity.Error,
            message: `❌ "${token}" is not a defined token.`,
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column + match[0].length,
          };
        });

      monaco.editor.setModelMarkers(model, "custom-token-check", markers);
    };

    validateTokens();
    model.onDidChangeContent(() => validateTokens());
  }

  const handleFormatCode = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "vs-dark" ? "vs-light" : "vs-dark"));
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="heading">Code Editor</h1>

      <div className="container">
        <button onClick={handleThemeToggle} className="theme">
          Switch to {theme === "vs-dark" ? "Light" : "Dark"} Theme
        </button>
        <button className="format" onClick={handleFormatCode}>
          Format Code
        </button>
      </div>

      <Editor
        height="500px"
        language={language}
        value={snippet}
        onChange={(value) => setSnippet(value || "")}
        onMount={handleEditorDidMount}
        theme={theme}
      />

      <div className="btn-container">
        <button className="btn" onClick={() => handleLanguageChange("json")}>
          JSON
        </button>
        <button
          className="btn"
          onClick={() => handleLanguageChange("javascript")}
        >
          JS
        </button>
      </div>
    </div>
  );
};

export default App;
