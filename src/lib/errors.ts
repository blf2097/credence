export function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const direct = firstString(
      record.shortMessage,
      record.message,
      record.reason,
      record.error,
      record.errorMsg,
      record.details,
      record.detail,
      record.code,
    );
    if (direct) return direct;

    const response = record.response as Record<string, unknown> | undefined;
    const responseData = response?.data as Record<string, unknown> | string | undefined;
    if (typeof responseData === 'string') return responseData;
    if (responseData) {
      const nested = firstString(
        responseData.error,
        responseData.message,
        responseData.errorMsg,
        responseData.detail,
      );
      if (nested) return nested;
    }

    const cause = record.cause as Record<string, unknown> | undefined;
    const causeMessage = firstString(cause?.message, cause?.code);
    if (causeMessage) return causeMessage;

    try {
      return JSON.stringify(record, stringifyErrorValue);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  return String(error);
}

export async function readJsonOrText(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return null;
}

function stringifyErrorValue(_key: string, value: unknown) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}
