"use client";

import { useState } from "react";

type ClassificationResult = {
  label: number;
  category: string;
  reason: string;
};

const categories = [
  { label: 0, name: "민원행정", description: "일반 민원 접수, 서류 검토, 행정 안내" },
  { label: 1, name: "복지돌봄", description: "복지 서비스, 지원금, 돌봄 지원 요청" },
  { label: 2, name: "안전재난", description: "재난, 안전사고, 긴급 대응 관련 민원" },
  { label: 3, name: "교통도로", description: "도로, 교통, 신호, 포트홀 관련 민원" },
  { label: 4, name: "환경위생", description: "수질, 하천, 쓰레기, 악취, 위생 관련 민원" },
  { label: 5, name: "건축주택", description: "건축, 주택, 누수, 보수, 시설 관련 민원" },
  { label: 6, name: "교육문화", description: "학교, 교육, 문화, 체육시설 관련 민원" },
  { label: 7, name: "경제산업", description: "경제, 산업, 창업, 업체 지원 관련 민원" },
];

const examples = [
  {
    label: "S1",
    title: "안전재난",
    content:
      "도로 옆 산사태 위험이 있는 곳을 발견했습니다. 안전점검 요청드립니다.",
  },
  {
    label: "S2",
    title: "환경위생",
    content:
      "수질 오염 신고합니다. 인근 하천에서 이상 현상이 발견되었습니다.",
  },
  {
    label: "S3",
    title: "교통도로",
    content:
      "신호등 고장으로 교통체증이 심합니다. 조속한 수리 부탁드립니다.",
  },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    if (!input.trim()) {
      setError("민원 내용을 입력한 뒤 자동 분류를 눌러주세요.");
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ complaintText: input }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "분류 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      setResult({
        label: data.label,
        category: data.category,
        reason: data.reason,
      });
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "분류 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (content: string) => {
    setInput(content);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                LLM API 기반 8개 부서 자동 분류
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
                민원 자동분류 시스템
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                민원 내용을 입력하면 8개 카테고리로 자동 분류되는 프론트엔드 화면입니다.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              라벨은 숫자 0~7 기준으로 분류되며, 예시 입력과 결과를 바로 확인할 수 있습니다.
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">민원 내용 입력</h2>
                <p className="text-sm text-slate-500">
                  입력한 내용에 따라 자동으로 담당 카테고리를 추천합니다.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                8개 카테고리 자동 분류
              </span>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: 도로 옆 산사태 위험이 있는 곳을 발견했습니다. 안전점검 요청드립니다."
              className="mt-5 min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              {examples.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => handleExample(example.content)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  {example.label} · {example.title}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleClassify}
              disabled={loading}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "분류 중..." : "자동 분류하기"}
            </button>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-slate-900">결과 영역</h3>
              {error ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </p>
              ) : result ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                      분류 라벨
                    </span>
                    <span className="text-lg font-semibold text-slate-900">
                      {result.label} · {result.category}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-slate-600">{result.reason}</p>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    입력된 민원 내용을 기반으로 숫자 라벨과 카테고리를 예측한 결과입니다.
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  민원 내용을 입력하고 분류 버튼을 눌러 결과를 확인해 보세요.
                </p>
              )}
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">8개 카테고리 안내</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              각 민원은 아래 8개 카테고리 중 하나로 분류됩니다.
            </p>
            <div className="mt-5 grid gap-3">
              {categories.map((category) => (
                <div
                  key={category.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-semibold text-slate-900">
                    {category.label} {category.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{category.description}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
