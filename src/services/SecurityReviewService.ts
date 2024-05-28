import dotenv from 'dotenv';
import { $log } from "@tsed/common";
import { Service } from "@tsed/di";
import axios from "axios";
import { FileModel } from "../models/FileModel";
import { IssueModel } from "../models/IssueModel";

dotenv.config();
// TODO: Read from env
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;;

@Service()
export class SecurityReviewService {
  async reviewCode(context: string, files: FileModel[]): Promise<IssueModel[] | undefined> {
    const formattedFiles = files.map(file => `File: ${file.filename}\n${file.content}`).join("\n");
    const initialPrompt = `
      Analyze the following Solidity smart contract files for security issues. For each issue you find, provide the following details:
      1. The filename where the issue is found.
      2. The line number range where the issue is located.
      3. An issue title which can not exceeds 5 words.
      4. A detailed description of the issue.
      
      Please return the result in JSON format with the following structure:
      {
        "result": [
          {
            "filename": "example.sol",
            "line_range": "10-15",
            "issue_title": "Reentrancy vulnerability",
            "issue_description": "The withdraw function does not follow the checks-effects-interactions pattern."
          },
          {
            "filename": "example2.sol",
            "line_range": "20-25",
            "issue_title": "Integer overflow",
            "issue_description": "The calculation in the add function can lead to overflow."
          }
        ],
      }
      
      Don't do the following things:
      1. Use @audit tag
      2. Put content inside <>
      3. Put object inside issue_description
      
      The context of this review:
      ${context}
      
      Here are the Solidity files:
      ${formattedFiles}
    `;
    const MAX_TOKENS = 600;
    const model = "gpt-4o";
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    let completeContent = "";
    let stopGeneration = false;
    const prompt = initialPrompt;
    let maxTry = 1;
    const conversation_history = [
      {
        role: "system",
        content: "You are a helpful assistant and security expert that analyzes Solidity smart contracts for security issues."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    while (!stopGeneration && maxTry--) {
      const response = await axios.post(
        apiUrl,
        {
          model: model,
          messages: conversation_history,
          max_tokens: MAX_TOKENS,
          temperature: 0.6,
          frequency_penalty: 1,
          response_format: {
            "type": "json_object",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      const generatedText = response.data.choices[0].message.content;
      completeContent += generatedText;
      $log.info("Generated content", generatedText);

      try {
        const result = JSON.parse(completeContent).result;
        stopGeneration = true;
        for (const issue of result) {
          if (issue.line_range && !issue.line_range.includes("-")) {
            issue.line_range = `${issue.line_range}-${issue.line_range}`;
          }
        }
        const filteredResult = result.filter((issue: IssueModel) => {
          return (
            issue.filename &&
            issue.line_range &&
            issue.issue_title &&
            issue.issue_description
          );
        });
        return filteredResult as IssueModel[];
      } catch (err) {
        $log.error(err.message);
        conversation_history.push({
          "role": "assistant",
          "content": generatedText,
        })
        conversation_history.push({
          "role": "user",
          "content": "Complete the remaining unfinished JSON. Start outputting from the next letter where the previous output ends. Don't repeat previous output!!!",

        })
      }
    }

    $log.error("Number of generation exceeds max try");
  }
}

