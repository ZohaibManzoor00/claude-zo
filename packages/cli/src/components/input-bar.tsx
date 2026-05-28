import type { KeyBinding, TextareaRenderable } from "@opentui/core";
import { useRenderer } from "@opentui/react";
import { useCallback, useEffect, useRef } from "react";
import { useDialog } from "../providers/dialog";
import { useKeyboardLayer } from "../providers/keyboard-layer";
import { useTheme } from "../providers/theme";
import { useToast } from "../providers/toast";
import { EmptyBorder } from "./border";
import { CommandMenu } from "./command-menu";
import type { Command } from "./command-menu/types";
import { useCommandMenu } from "./command-menu/use-command-menu";
import { StatusBar } from "./status-bar";

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
  const toast = useToast();
  const dialog = useDialog();
  const { setResponder, isTopLayer } = useKeyboardLayer();
  const { colors } = useTheme();
  const { showCommandMenu, commandQuery, selectedIndex, scrollRef, resolveCommand, setSelectedIndex, handleContentChange } =
    useCommandMenu();

  const handleCommand = useCallback(
    (command?: Command) => {
      const textarea = textareaRef.current;
      if (!textarea || !command) return;

      textarea.setText("");

      if (command.action) command.action({ exit: () => renderer.destroy(), toast, dialog });
      else textarea.insertText(command.value + " ");
    },
    [renderer],
  );

  const handleCommandExecute = useCallback(
    (index: number) => {
      const command = resolveCommand(index);
      handleCommand(command);
    },
    [resolveCommand, handleCommand],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.onSubmit = () => onSubmitRef.current();
  }, []);

  const handleSubmit = useCallback(() => {
    if (disabled) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = textarea.plainText;
    if (text.length === 0) return;

    onSubmit(text);
    textarea.setText("");
  }, []);

  onSubmitRef.current = () => {
    if (disabled) return;

    if (showCommandMenu) {
      const command = resolveCommand(selectedIndex);
      handleCommand(command);
      return;
    }

    handleSubmit();
  };

  const handleTextareaContentChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    handleContentChange(textarea.plainText);
  }, []);

  // Register base layer responder for ctrl+c dismissal
  useEffect(() => {
    setResponder("base", () => {
      if (disabled) return false;

      const textarea = textareaRef.current;
      if (textarea && textarea.plainText.length > 0) {
        textarea.setText("");
        return true;
      }

      return false;
    });

    return () => setResponder("base", null);
  }, [disabled, setResponder]);

  return (
    <box width="100%" alignItems="center">
      <box
        border={["left"]}
        borderColor={colors.primary}
        customBorderChars={{
          ...EmptyBorder,
          vertical: "┃",
          bottomLeft: "╹",
        }}
        width="100%"
      >
        <box position="relative" justifyContent="center" paddingX={2} paddingY={1} backgroundColor={colors.surface} width="100%" gap={1}>
          {showCommandMenu && (
            <box position="absolute" bottom="100%" left={0} width="100%" backgroundColor={colors.surface} zIndex={10}>
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
            focused={!disabled && (isTopLayer("base") || isTopLayer("command") || isTopLayer("mention"))}
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
