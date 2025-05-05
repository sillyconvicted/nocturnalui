"use client";

import React from "react";
import MonacoEditor from "./MonacoEditor";

export default function EditorWrapper({ code, setCode, onExecute }) {
  return (
    <div className="editor-full-container">
      <MonacoEditor 
        code={code} 
        setCode={setCode} 
        onExecute={onExecute} 
      />
    </div>
  );
}
