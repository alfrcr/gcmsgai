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
Generate a git commit message for the following code diff with the following IMPORTANT specification:
1. The message must be a MAXIMUM 80 CHARACTERS.
2. Summarize the changes, what is the file changed, what the new change does, is there lines of code removed, in one sentence.
3. Language must be English and in the form of present tense, and please don't put period after sentence.
4. Your message will be used as a commit message directly. So, make sure it is clear and concise.

Code diff:
  ${diff}

IMPORTANT:
PLEASE ONLY WRITE THE COMMIT MESSAGE, DON'T ADD "Here is a ..." or similar phrase, or ADDITIONAL "Note:". ONLY EXACTLY THE MESSAGE.
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
