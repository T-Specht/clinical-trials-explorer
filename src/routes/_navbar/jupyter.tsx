import { Button } from "@/components/ui/button";
import { JUPYTER_PORT } from "@/lib/constants";
import { Editor, Monaco, useMonaco } from "@monaco-editor/react";
import { createFileRoute } from "@tanstack/react-router";
import Playground from "javascript-playgrounds";
import { editor } from "monaco-editor";
import { useRef } from "react";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
// function scopeEval(scope: any, script: string) {
//   script = script
//     // .trim()
//     // .replace(/^var /, "")
//     // .replace(/^let /, "")
//     // .replace(/^const /, "");

//     return new Function(script).bind(scope);
//   //return AsyncFunction(script).bind(scope)();
// }

//const scopedEval = (scope: any, script: string) => Function(`"use strict"; ${script}`).bind(scope)();

function scopedEval(context: any, expr: string) {
  const evaluator = Function.apply(null, [...Object.keys(context), 'expr', "return eval('expr = undefined;' + expr)"]);
  return evaluator.apply(null, [...Object.values(context), expr]);
}


export const Route = createFileRoute("/_navbar/jupyter")({
  component: () => {
    const monaco = useMonaco();
    const editorRef = useRef<editor.IStandaloneCodeEditor>();

    const runCode = () => {
      console.log("running code");
      let code = editorRef.current?.getValue() || '';

      scopedEval({
        entries: [1, 2, 34]
      }, code);
      //fn();
      //console.log(fn);
      
    };
    return (
      <div>
        {/* <iframe
          src={`http://localhost:${JUPYTER_PORT}`}
          className="w-[100%] h-[calc(100vh-45px)]"
        ></iframe> */}
        {/* <Playground
          targetOrigin="*"
          style={{ width: 800, height: 500 }}
          typescript={{
            enabled: true,
          }}
          code="console.log('Hello, world 2!')"
          sharedEnvironment={true}
        /> */}
        <Editor
          height="80vh"
          defaultLanguage="javascript"
          defaultValue="// some comment"
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
        <div id="playground"></div>
        <Button onClick={runCode}>Run Code</Button>
      </div>
    );
  },
});
