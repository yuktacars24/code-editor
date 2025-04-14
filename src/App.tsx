import Editor from "@monaco-editor/react";
import React, { useState, useRef } from "react";
import type * as Monaco from "monaco-editor";

import "./App.css";
//typescript -> Record<keyType,valueType>
const snippets: Record<string, string> = {
  javascript: `console.log("Try JS Editor");`,
  json: `{
    "name": "Your name",
    "age": 25
  }`,
};

const App: React.FC = () => {
  const editorRef = useRef<any>(null);
  const [language, setLanguage] = useState("javascript");
  const [snippet, setSnippet] = useState(snippets["javascript"]);
  const [theme, setTheme] = useState("vs-dark");


  function handleLanguageChange(lang: string) {
    setLanguage(lang);
    setSnippet(snippets[lang]);
  }

  // function handleEditorDidMount(editor: any, monaco: any) {
  //   editorRef.current = editor;

  //   monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  //     noSemanticValidation: false,
  //     noSyntaxValidation: false,
  //   });

  //   monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
  //     target: monaco.languages.typescript.ScriptTarget.ES2020,
  //     allowNonTsExtensions: true,
  //     checkJs: true,
  //   });
  // }
  function handleEditorDidMount(
    editor: any,
    monaco: typeof import("monaco-editor")
  ) {
    editorRef.current = editor;
  
    // ✅ Enable JS diagnostics (optional: you can tweak these)
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      checkJs: true,
    });
  
    // ✅ Tokens that are allowed in {{token}} format
    const definedTokens = ["alpha_numeric", "username", "user_id"];
  
    const model = editor.getModel();
  
    // 🔍 Validate all {{token}} usage
    function validateCustomTokens() {
      const code = model.getValue();
      const matches = [...code.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)];
  
      const markers: Monaco.editor.IMarkerData[] = matches.map(match => {
        const fullMatch = match[0]; // e.g. {{user_id}}
        const tokenName = match[1]; // e.g. user_id
        const startIndex = match.index || 0;
  
        const beforeText = code.slice(0, startIndex);
        const lines = beforeText.split("\n");
        const lineNumber = lines.length;
        const column = lines[lines.length - 1].length + 1;
  
        if (!definedTokens.includes(tokenName)) {
          return {
            severity: monaco.MarkerSeverity.Error,
            message: `❌ "${tokenName}" is not a defined token.`,
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column + fullMatch.length,
          };
        }
  
        return null;
      }).filter(Boolean) as Monaco.editor.IMarkerData[];
  
      monaco.editor.setModelMarkers(model, "custom-token-check", markers);
    }
  
    // 🔁 Re-run validation on every code change
    model.onDidChangeContent(() => validateCustomTokens());
  
    // 🚀 Run once initially
    validateCustomTokens();
  
    // ✨ Register custom autocomplete provider
    monaco.languages.registerCompletionItemProvider("javascript", {
      triggerCharacters: ["{"],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
  
        // Only trigger suggestions after `{{`
        const match = textUntilPosition.match(/\{\{([a-zA-Z0-9_]*)$/);
        if (!match) return { suggestions: [] };
  
        const suggestions = definedTokens.map(token => ({
          label: token,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: token ,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column - match[1].length,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
        }));
  
        return { suggestions };
      },
    });
  }
  
  
  

  function handleFormatCode() {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  }
  const handleTheme = () => {
    setTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="heading">Code Editor</h1>
      <div className="container">
        <button onClick={handleTheme} className="theme">
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
        onMount={(editor, monaco) => handleEditorDidMount(editor, monaco)}
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
