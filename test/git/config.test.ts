import { execFileSync } from "node:child_process";

import { describe, expect, it } from "@jest/globals";

import { parseGitConfig } from "../../src/git/config.js";

const validConfigs: Record<string, string> = {
  "generic entries, quoting, comments, and continuations": String.raw`# comment
[CoRe]
  Bare
  Empty =
  Quoted = "a # b; c\n\t\b\\\"" ; trailing comment
  Continued = first\
    second
[remote "Origin"]
  URL = https://example.test/repo.git # trailing comment
[remote.UPPER]
  url = ssh://example.test/upper.git
[include]
  path = ../common.conf`,

  "repeated values for the same key":
    '[remote "origin"]\nurl = https://example.test/one.git\nurl = https://example.test/two.git\n',

  "escaped subsections, legacy subsections, and inline entries":
    '[remote "Or\\"igin"] url = first\r\n[remote.UPPER]\nurl = second',

  "BOM, blank lines, and leading whitespace":
    "\uFEFF\n \t# comment after a blank line\n\n[core]\n\tname = value",

  "carriage returns as whitespace": "[core]\rname = value\r",

  "empty values, adjacent quoted fragments, and trailing whitespace":
    '[core]\nempty = ""\njoined = pre" mid "post  \t; trailing comment\n',

  "quoted continuations and escaped subsection backslashes":
    '[remote "Or\\\\igin"]\nurl = "first\\\n    second"',

  "terminal backslash continuation": "[core]\nvalue = first" + "\\",

  "variables before the first section":
    "KEY = value\nBare\n[core]\nMixed = configured",
};

const invalidConfigs: Record<string, string> = {
  "unsupported quoted escapes": '[core]\nvalue = "bad\\q"',
  "empty section names": "[]\nkey = value",
  "invalid section-name characters": "[core@]\nkey = value",
  "unterminated subsection": '[remote "origin\nurl = value',
  "unterminated quoted value": '[core]\nvalue = "unterminated',
  "invalid unquoted escapes": "[core]\nvalue = bad\\q",
  "variable text without an equals sign": "[core]\nvalue extra",
  "empty variable name": "[core]\n= value",
  "invalid leading variable character": "[core]\n@key = value",
  "numeric variable name": "[core]\n1key = value",
  "carriage return before equals sign": "[core]\nkey\r= value",
  "vertical tab before equals sign": "[core]\nkey\v= value",
  "form feed before equals sign": "[core]\nkey\f= value",
};

function gitConfigListViaGit(source: string): string {
  return execFileSync(
    "git",
    ["config", "--file", "-", "--no-includes", "--null", "--list"],
    { input: source, encoding: "utf8" },
  );
}

describe("parseGitConfig", () => {
  it.each(Object.entries(validConfigs))("parses %s", (_name, source) => {
    const parsed = parseGitConfig(source);

    // render parsed config in the same format as `git config --null --list`,
    // so we can compare it directly.
    const output = [...parsed]
      .flatMap(([key, values]) =>
        // Git prints valueless entries as a bare key
        values.map((value) =>
          value === null ? `${key}\0` : `${key}\n${value}\0`,
        ),
      )
      .join("");

    expect(output).toEqual(gitConfigListViaGit(source));
  });

  it.each(Object.entries(invalidConfigs))("rejects %s", (_name, source) => {
    expect(() => parseGitConfig(source)).toThrow();
    expect(() => gitConfigListViaGit(source)).toThrow();
  });
});
