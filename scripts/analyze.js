import fs from "fs";
import process from "process";

// --- CONFIG ---
const CRITICAL_PATTERNS = [
  {
    name: "Possible null dereference",
    regex: /\.([a-zA-Z0-9_]+)\s*\(/,
    check: (content) => content.includes("undefined") || content.includes("null"),
  },
  {
    name: "Dangerous eval usage",
    regex: /eval\s*\(/,
  },
  {
    name: "Missing auth check",
    regex: /app\.(get|post|put|delete)\(/,
    check: (content) => !content.includes("auth") && !content.includes("middleware"),
  },
  {
    name: "Direct DB write without validation",
    regex: /insert|update|create/i,
    check: (content) => !content.includes("validate"),
  },
];

// --- MAIN ---
const files = process.argv[2]?.split(" ") || [];

let findings = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  const content = fs.readFileSync(file, "utf-8");

  for (const pattern of CRITICAL_PATTERNS) {
    if (pattern.regex.test(content)) {
      if (!pattern.check || pattern.check(content)) {
        findings.push({
          file,
          issue: pattern.name,
        });
      }
    }
  }
}

// --- OPTIONAL: AI ANALYSIS ---
async function runAIAnalysis(diffText) {
  if (!process.env.OPENAI_API_KEY) return [];

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.3",
      input: `
You are a critical bug finder.

Analyze this code and ONLY return high severity issues:
- data loss
- crashes
- auth bypass
- race conditions

Code:
${diffText}

Return JSON array:
[{ "issue": "...", "reason": "..."}]
      `,
    }),
  });

  const data = await res.json();

  try {
    return JSON.parse(data.output[0].content[0].text);
  } catch {
    return [];
  }
}

// --- EXECUTION ---
(async () => {
  let aiFindings = [];

  try {
    const combined = files
      .filter((f) => fs.existsSync(f))
      .map((f) => fs.readFileSync(f, "utf-8"))
      .join("\n");

    aiFindings = await runAIAnalysis(combined);
  } catch (e) {
    console.error("AI analysis failed:", e);
  }

  const allFindings = [...findings, ...aiFindings];

  if (allFindings.length > 0) {
    console.log("🚨 Critical issues found:\n");

    for (const f of allFindings) {
      console.log(`- ${f.file || "AI"}: ${f.issue}`);
    }

    process.exit(1); // FAIL CI
  } else {
    console.log("✅ No critical bugs found");
  }
})();
