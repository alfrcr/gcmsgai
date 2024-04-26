#!/usr/bin/env node

import { execSync } from "child_process";
import axios from "axios";

function getDiff() {
  try {
    const gitCommand = "git diff --staged";
    return execSync(gitCommand, { encoding: "utf-8" }).trim();
  } catch (error) {
    console.error("Error reading staged files:", error);
    return "";
  }
}

const prompt = (diff) => `
Generate a git commit message for the following code diff with the following specification:
1. The message must be a maximum 80 characters.
2. Summarize the code, what the code does, in one sentence.
3. Language must be English and in the form of present tense.
4. IMPORTANT! Please respond with ONLY the commit message. EXCLUDE everything else!

Code diff:
    ${diff}
`;

async function createCommitMessageFrom(diff) {
  const url = "http://localhost:11434/api/generate";

  const body = {
    model: "llama3",
    prompt: prompt(diff),
    stream: false,
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data?.response;
  } catch (error) {
    console.error("Error posting prompt:", error);
  }
}

function commit(message, args) {
  const cmd = `git commit -m "${message}" ${args}`;
  execSync(cmd, { encoding: "utf-8" });
}

async function main(args) {
  const diff = getDiff();
  const msg = await createCommitMessageFrom(diff);
  commit(msg, args);
}

main(process.argv.slice(2));
