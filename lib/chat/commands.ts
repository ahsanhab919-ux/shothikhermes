import type { ChatSlashCommand } from "./types";

const SUPPORTED_FLAGSHIP_COMMANDS = new Set(["spec"]);

export function parseFlagshipSlashCommand(input: string): ChatSlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const match = /^\/([a-z0-9-]+)(?:\s+([\s\S]*))?$/i.exec(trimmed);
  if (!match) return null;

  const commandName = match[1].toLowerCase();
  if (!SUPPORTED_FLAGSHIP_COMMANDS.has(commandName)) return null;

  const argument = (match[2] ?? "").trim();
  return {
    name: "spec",
    argument: argument || undefined,
  };
}

export function getSlashCommandDisplayText(input: string) {
  const command = parseFlagshipSlashCommand(input);
  if (!command) return null;

  return {
    command,
    body: command.argument ?? "",
  };
}
