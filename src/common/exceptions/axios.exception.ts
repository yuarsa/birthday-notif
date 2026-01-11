import { Logger } from '@nestjs/common';
import { AxiosError } from 'axios';

export function handleAxiosException(
  error: unknown,
  logger: Logger,
  contextInfo?: string,
): never {
  const contextMsg = contextInfo ? `[${contextInfo}]` : '';

  if (error instanceof AxiosError) {
    const status = error.response?.status || 'Unknown Status';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'Unknown URL';

    // Parse error message from external API response
    const responseData = error.response?.data;
    const externalMessage =
      typeof responseData === 'object'
        ? JSON.stringify(responseData)
        : error.message;

    logger.error(
      `External API Error ${contextMsg} | ${method} ${url} | Status: ${status} | Message: ${externalMessage}`,
    );

    throw new Error(`External API Failed (${status}): ${externalMessage}`);
  } else {
    const msg = error instanceof Error ? error.message : 'Unknown error';

    logger.error(`Unexpected Error ${contextMsg}: ${msg}`);

    throw error;
  }
}
