import { EditorState, EditorThemeClasses } from "lexical";
import { useState } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { cn } from "@/lib/utils";

const theme: EditorThemeClasses = {
  root: "focus:outline-none",
  text: {
    bold: "text-bold",
    italic: "text-italic",
    underline: "text-underline",
    code: "text-code",
    highlight: "text-highlight",
    strikethrough: "text-strikethrough",
    subscript: "text-subscript",
    superscript: "text-superscript",
  },
  banner: "banner",
  code: "markdown-code",
};

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
// const MyCustomAutoFocusPlugin: React.FC = () => {
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     // Focus the editor when the effect fires!
//     editor.focus();
//   }, [editor]);

//   return null;
// };

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: any) {
  console.error(error);
}

export function Editor(props: {
  inputMarkdown: string;
  className?: string;
  prose: boolean;
  onChange: (markdown: string) => unknown;
  placeholderText: React.ReactNode
}) {
  const [_, setMarkdown] = useState(props.inputMarkdown);

  const onChange = (editorState: EditorState) => {
    editorState.read(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      //   console.log(markdown);
      setMarkdown(markdown);
      props.onChange(markdown);
    });
  };

  return (
    <div
      className={cn(
        props.prose ? "prose dark:prose-invert" : "",
        props.className
      )}
    >
      <LexicalComposer
        initialConfig={{
          namespace: "MyEditor",
          theme,
          onError,
          editorState: () => $convertFromMarkdownString(props.inputMarkdown),
          nodes: [
            //BannerNode,
            HeadingNode,
            //ImageNode,
            QuoteNode,
            CodeNode,
            ListNode,
            ListItemNode,
            LinkNode,
          ],
        }}
      >
        {/* <MarkdownShortcutPlugin transformers={TRANSFORMERS} /> */}
        <RichTextPlugin
          contentEditable={<ContentEditable spellCheck />}
          placeholder={<div>{props.placeholderText}</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <TabIndentationPlugin />
        <ListPlugin></ListPlugin>
        <HistoryPlugin />
        {/* <MyCustomAutoFocusPlugin /> */}
        <MarkdownShortcutPlugin
          transformers={TRANSFORMERS}
        ></MarkdownShortcutPlugin>
        <OnChangePlugin onChange={onChange} />
      </LexicalComposer>
    </div>
  );
}
