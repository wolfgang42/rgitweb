/** Parsing of Git config files and extraction of configured remote URLs. */

import { NotFoundError, type ConfigValue, type GitConfig } from "./types.js";
import { type Transport } from "./transport.js";

const fail = (message: string): never => {
  throw new Error(`invalid config line: ${message}`);
};

const isSpace = (char: string | undefined): boolean =>
  char === " " || char === "\t" || char === "\r";
const isKeySpace = (char: string): boolean => char === " " || char === "\t";
const isKeyChar = (char: string): boolean => /[A-Za-z0-9-]/.test(char);

/** Cursor over the config source, with the small primitives the parser needs. */
class Scanner {
  private position: number;

  constructor(private readonly source: string) {
    this.position = source.startsWith("\uFEFF") ? 1 : 0;
  }

  get done(): boolean {
    return this.position >= this.source.length;
  }

  /** Returns the current character, or "" at end of input. */
  peek(): string {
    return this.source.charAt(this.position);
  }

  advance(): string {
    return this.source.charAt(this.position++);
  }

  /** Consumes `char` if it's next; reports failure otherwise. */
  expect(char: string, message: string): void {
    if (this.advance() !== char) fail(message);
  }

  skipWhile(predicate: (char: string) => boolean): void {
    while (!this.done && predicate(this.peek())) this.position++;
  }

  skipToLineEnd(): void {
    this.skipWhile((char) => char !== "\n");
  }

  /** Consumes and returns a run of `predicate` characters (may be empty). */
  readWhile(predicate: (char: string) => boolean): string {
    const start = this.position;
    this.skipWhile(predicate);
    return this.source.slice(start, this.position);
  }
}

/** Parses `[section]` or `[section "subsection"]`/`[section.subsection]`, returning the canonical prefix. */
function parseSectionHeader(scanner: Scanner): string {
  scanner.expect("[", "expected section or key");
  const sectionName = scanner.readWhile(
    (char) => !isSpace(char) && char !== "]",
  );
  if (!sectionName || !/^[A-Za-z0-9.-]+$/.test(sectionName)) {
    fail(sectionName ? "invalid section name" : "empty section name");
  }
  let name = sectionName.toLowerCase();

  const hadSpace = scanner.readWhile(isSpace) !== "";
  if (hadSpace) {
    scanner.expect('"', "expected quoted subsection");
    name += ".";
    while (scanner.peek() !== '"') {
      if (scanner.done) fail("unterminated subsection");
      let char = scanner.advance();
      if (char === "\n") fail("unterminated subsection");
      if (char === "\\") {
        if (scanner.done || scanner.peek() === "\n") {
          fail("unterminated subsection escape");
        }
        char = scanner.advance();
      }
      name += char;
    }
    scanner.advance();
  }
  scanner.expect("]", "expected closing bracket");

  return name;
}

const escapes: Record<string, string> = {
  "": "", // end of file -- git accepts and ignores `\<EOF>`
  "\n": "", // line continuation -- i.e. ignore the newline character
  t: "\t",
  b: "\b",
  n: "\n",
  "\\": "\\",
  '"': '"',
};

/** Reads everything after `=` on a variable line, unescaping and trimming outside quotes. */
function parseValue(scanner: Scanner): string {
  let value = "";
  let quoted = false;
  /** the position of the first unquoted trailing whitespace */
  let trimLength: number | undefined;

  scanner.skipWhile(isSpace);
  while (!scanner.done) {
    const char = scanner.advance();
    if (char === "\n") {
      if (quoted) fail("unterminated quoted value");
      else break;
    } else if (!quoted && (char === "#" || char === ";")) {
      scanner.skipToLineEnd();
      break;
    }
    if (!quoted && isSpace(char)) {
      trimLength ??= value.length;
    } else {
      trimLength = undefined;
    }
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "\\") {
      value += escapes[scanner.advance()] ?? fail("invalid escape sequence");
    } else {
      value += char;
    }
  }
  if (quoted) fail("unterminated quoted value");
  return value.slice(0, trimLength);
}

/** Parses one `key` or `key = value` line and returns its canonical key and value. */
function parseVariable(scanner: Scanner): [string, ConfigValue] {
  const key = scanner.readWhile(isKeyChar).toLowerCase();
  if (!key) fail("empty variable name");
  if (!/^[a-z]/.test(key)) fail("invalid variable name");
  scanner.skipWhile(isKeySpace);

  let value: ConfigValue = null;
  if (scanner.peek() === "=") {
    scanner.advance();
    value = parseValue(scanner);
  } else if (!scanner.done && scanner.peek() !== "\n") {
    fail("expected equals sign or end of line");
  }

  return [key, value];
}

export function parseGitConfig(source: string): GitConfig {
  const values = new Map<string, ConfigValue[]>();
  const scanner = new Scanner(source);

  let section: string | undefined;
  while (!scanner.done) {
    const char = scanner.peek();
    if (char === "\n" || isSpace(char)) {
      scanner.advance();
    } else if (char === "#" || char === ";") {
      scanner.skipToLineEnd();
    } else if (char === "[") {
      section = parseSectionHeader(scanner);
    } else {
      const [subkey, value] = parseVariable(scanner);
      const canonicalKey = section ? `${section}.${subkey}` : subkey;
      const existingValues = values.get(canonicalKey);
      if (existingValues) existingValues.push(value);
      else values.set(canonicalKey, [value]);
    }
  }

  return values;
}

export async function fetchGitConfig(
  transport: Transport,
  baseUrl: string,
): Promise<GitConfig | undefined> {
  try {
    return parseGitConfig(await transport.fetchText(`${baseUrl}/config`));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return undefined;
    }
    throw error;
  }
}
