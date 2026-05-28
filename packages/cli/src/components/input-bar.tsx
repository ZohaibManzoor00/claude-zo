import type { KeyBinding, TextareaRenderable } from "@opentui/core";
import { EmptyBorder, SplitBorderChars } from "./left-border";
import { StatusBar } from "./status-bar";
import { CommandMenu } from "./command-menu";
import { useCallback, useEffect, useRef } from "react";
import { useRenderer } from "@opentui/react";
import { useCommandMenu } from "./command-menu/use-command-menu";
import type { Command } from "./command-menu/types";

type Props = {
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
  { name: "return", action: "submit" },
  { name: "enter", action: "submit" },
  { name: "return", shift: true, action: "newline" },
  { name: "enter", shift: true, action: "newline" },
];

export function InputBar({ onSubmit, disabled = false }: Props) {
  const textareaRef = useRef<TextareaRenderable>(null);
  const onSubmitRef = useRef<() => void>(() => {});
  const renderer = useRenderer();
  const { showCommandMenu, commandQuery, selectedIndex, scrollRef, resolveCommand, setSelectedIndex, handleContentChange } =
    useCommandMenu();

  const handleCommand = useCallback(
    (command?: Command) => {
      const textarea = textareaRef.current;
      if (!textarea || !command) return;

      textarea.setText("");

      if (command.action) command.action({ exit: () => renderer.destroy() });
      else textarea.insertText(command.value + " ");
    },
    [renderer],
  );

  const handleCommandExecute = useCallback((index: number) => {
      const command = resolveCommand(index);
      handleCommand(command);
    }, [resolveCommand, handleCommand],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.onSubmit = () => onSubmitRef.current();
  }, []);

  onSubmitRef.current = () => {
    if (disabled) return;

    if (showCommandMenu) {
      const command = resolveCommand(selectedIndex);
      handleCommand(command);
      return;
    }

    // handleSubmit();
  };

  const handleTextareaContentChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    handleContentChange(textarea.plainText);
  }, []);

  return (
    <box width="100%" alignItems="center">
      <box
        border={["left"]}
        borderColor="cyan"
        customBorderChars={{
          ...EmptyBorder,
          vertical: "┃",
          bottomLeft: "╹",
        }}
        width="100%"
      >
        <box position="relative" justifyContent="center" paddingX={2} paddingY={1} backgroundColor="#1A1A24" width="100%" gap={1}>
          {showCommandMenu && (
            <box position="absolute" bottom="100%" left={0} width="100%" backgroundColor="#1A1A24" zIndex={10}>
              <CommandMenu
                query={commandQuery}
                selectedIndex={selectedIndex}
                scrollRef={scrollRef}
                onSelect={setSelectedIndex}
                onExecute={handleCommandExecute}
              />
            </box>
          )}
          {/* {!showCommandMenu && showMentionMenu && (
            <box position="absolute" bottom="100%" left={0} width="100%" backgroundColor={colors.surface} zIndex={10}>
              <FileMentionMenu
                candidates={mentionCandidates}
                selectedIndex={mentionSelectedIndex}
                scrollRef={mentionScrollRef}
                onSelect={setMentionSelectedIndex}
                onExecute={handleMentionExecute}
              />
            </box>
          )} */}
          <textarea
            ref={textareaRef}
            focused={!disabled && showCommandMenu}
            keyBindings={TEXTAREA_KEY_BINDINGS}
            onContentChange={handleTextareaContentChange}
            placeholder={`Ask anything... "Fix a bug in the database"`}
          />
          <StatusBar />
        </box>
      </box>
    </box>
  );
}
