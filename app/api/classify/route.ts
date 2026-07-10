import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const categories = [
  "민원행정",
  "복지돌봄",
  "안전재난",
  "교통도로",
  "환경위생",
  "건축주택",
  "교육문화",
  "경제산업",
];

const prompt = `민원 내용을 아래 8개 카테고리 중 하나로 분류하세요.
응답은 반드시 JSON 형태로만 출력해야 합니다.
label은 0~7 숫자여야 하며, category는 정확히 아래 카테고리명 중 하나여야 합니다.
reason은 1~2문장으로 간결하게 작성하세요.

카테고리 목록:
0 민원행정
1 복지돌봄
2 안전재난
3 교통도로
4 환경위생
5 건축주택
6 교육문화
7 경제산업

JSON 예시:
{
  "label": 2,
  "category": "안전재난",
  "reason": "도로 옆 산사태 위험을 보고하여 안전점검이 필요함을 알 수 있어 안전재난으로 분류합니다."
}

민원 내용:
`;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const complaintText = body?.complaintText;

  if (!complaintText || typeof complaintText !== "string" || !complaintText.trim()) {
    return NextResponse.json(
      { error: "complaintText가 필요합니다." },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // Instantiate OpenAI inside the handler to avoid throwing during module evaluation
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Zod schema for runtime validation
  const classificationSchema = z.object({
    label: z.number().int().min(0).max(7),
    category: z.enum([
      "민원행정",
      "복지돌봄",
      "안전재난",
      "교통도로",
      "환경위생",
      "건축주택",
      "교육문화",
      "경제산업",
    ]),
    reason: z.string(),
  });

  // JSON Schema to pass to OpenAI structured outputs
  const jsonSchema = {
    type: "object",
    properties: {
      label: { type: "integer", minimum: 0, maximum: 7 },
      category: {
        type: "string",
        enum: [
          "민원행정",
          "복지돌봄",
          "안전재난",
          "교통도로",
          "환경위생",
          "건축주택",
          "교육문화",
          "경제산업",
        ],
      },
      reason: { type: "string" },
    },
    required: ["label", "category", "reason"],
    additionalProperties: false,
  } as const;

  try {
    const completion = await openai.responses.create({
      model: "gpt-4.1",
      input: `${prompt}${complaintText}`,
      // Responses API expects structured format under `text.format`.
      // Include a top-level `name` for the format and pass the schema under `json_schema.schema`.
      text: {
        format: {
          type: "json_schema",
          name: "classification",
          // Responses API expects the schema under `format.schema`
          schema: jsonSchema,
        },
      },
      max_output_tokens: 200,
      temperature: 0,
    });

    // SDK may provide a parsed output when using json_schema
    // Prefer structured parsed output when available
    // @ts-ignore - output_parsed exists when response_format json_schema is used
    const parsedFromSdk = (completion as any).output_parsed ?? null;

    let parsed: any = null;
    if (parsedFromSdk) {
      parsed = parsedFromSdk;
    } else {
      // Fallback: try to extract JSON text and parse
      const outputText = completion.output_text?.trim();
      if (!outputText) {
        throw new Error("OpenAI 응답이 비어 있습니다.");
      }

      const jsonStart = outputText.indexOf("{");
      const jsonEnd = outputText.lastIndexOf("}");
      const jsonString =
        jsonStart !== -1 && jsonEnd !== -1
          ? outputText.slice(jsonStart, jsonEnd + 1)
          : outputText;

      parsed = JSON.parse(jsonString);
    }

    // Validate & coerce using Zod
    const result = classificationSchema.parse(parsed);

    const label = result.label;
    const category = result.category;
    const reason = result.reason;

    return NextResponse.json({ label, category, reason });
  } catch (error) {
    // Log error for debugging
    console.error("/api/classify error:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "분류 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        detail,
      },
      { status: 500 }
    );
  }
}
