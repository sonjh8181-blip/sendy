/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Safe JSON parser that strips markdown code fences (```json ... ```)
 * and extracts valid JSON objects/arrays even if accompanied by extraneous text.
 */
export function cleanExtractJson<T = any>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new Error('응답 데이터가 비어 있습니다.');
  }

  let clean = text.trim();

  // 1. Remove markdown fences
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  clean = clean.replace(/\s*```$/i, '');
  clean = clean.trim();

  // 2. Try direct parse
  try {
    return JSON.parse(clean);
  } catch {
    // 3. Extract the outermost JSON object {...} or array [...]
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = clean.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // Sanitize trailing commas and control characters
        const sanitized = candidate
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F]+/g, ' ');
        return JSON.parse(sanitized);
      }
    }

    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const candidate = clean.substring(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        const sanitized = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(sanitized);
      }
    }

    throw new Error(`JSON 형식을 파싱할 수 없습니다: ${clean.substring(0, 100)}`);
  }
}

export interface SafeFetchResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Safe fetch wrapper that handles HTML error pages (e.g. 404, 500, Cloudflare/Vercel/Google errors)
 * and prevents syntax errors like "Unexpected token 'T', 'The page c'... is not valid JSON".
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const rawText = await res.text();
    const contentType = res.headers.get('content-type') || '';

    // Check if the server returned an HTML page instead of JSON
    const trimmed = rawText.trim();
    const isHtml =
      contentType.includes('text/html') ||
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<!doctype') ||
      trimmed.includes('The page cannot') ||
      trimmed.includes('The page could not') ||
      trimmed.includes('현재, 파일을 열 수 없습니다');

    if (isHtml) {
      let friendlyError = '';
      if (res.status === 404) {
        friendlyError = `API 엔드포인트를 찾을 수 없습니다 (404 Not Found). Vercel 배포 시 vercel.json 또는 API 라우팅을 확인해 주세요.`;
      } else if (res.status === 500) {
        friendlyError = `백엔드 서버 내부 오류 (500 Internal Server Error). Vercel 환경변수(GEMINI_API_KEY) 설정 여부를 확인하세요.`;
      } else if (res.status === 502 || res.status === 503) {
        friendlyError = `게이트웨이/외부 서비스 오류 (HTTP ${res.status}). Google Apps Script 또는 Gemini API 연결을 확인하세요.`;
      } else {
        friendlyError = `서버가 JSON 대신 HTML 에러 페이지를 반환했습니다 (HTTP ${res.status}).`;
      }

      return {
        ok: false,
        error: friendlyError,
        status: res.status
      };
    }

    // Try parsing JSON safely
    try {
      const parsed = cleanExtractJson<T>(rawText);
      if (!res.ok) {
        const errorMsg =
          (parsed as any)?.error ||
          (parsed as any)?.message ||
          `요청 실패 (HTTP ${res.status})`;
        return { ok: false, error: errorMsg, data: parsed, status: res.status };
      }
      return { ok: true, data: parsed, status: res.status };
    } catch {
      const snippet = trimmed.substring(0, 100);
      return {
        ok: false,
        error: `서버 응답을 JSON으로 변환할 수 없습니다 (HTTP ${res.status}): ${snippet}`,
        status: res.status
      };
    }
  } catch (netErr: any) {
    return {
      ok: false,
      error: `네트워크 연결 실패: ${netErr?.message || '서버에 연결할 수 없습니다.'}`,
      status: 0
    };
  }
}
