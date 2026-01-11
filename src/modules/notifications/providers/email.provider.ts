import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { handleAxiosException } from '../../../common/exceptions/axios.exception';
import { AxiosError } from 'axios';
import { UnrecoverableError } from 'bullmq';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private readonly defaultTimeout = 5000;

  constructor(private readonly httpService: HttpService) {}

  /**
   * General Send Email Method
   */
  async sendEmail(
    to: string,
    message: string,
    targetUrl: string,
  ): Promise<any> {
    const payload = { email: to, message: message };

    try {
      this.logger.debug(`Sending email to ${to} via ${targetUrl}...`);

      const { data } = await firstValueFrom(
        this.httpService.post(targetUrl, payload, {
          timeout: this.defaultTimeout,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const responseData = error.response?.data as unknown;

        // Extract error message from upstream
        let errorMessage: string;

        if (
          responseData &&
          typeof responseData === 'object' &&
          'message' in responseData
        ) {
          errorMessage = String((responseData as { message: unknown }).message);
        } else {
          errorMessage = JSON.stringify(responseData || error.message);
        }

        this.logger.error(
          `Email Provider Error: [${status}] ${errorMessage} - Target: ${to}`,
        );

        // 400 Bad Request = Unrecoverable (Do not retry)
        if (status === 400) {
          throw new UnrecoverableError(errorMessage);
        }

        // 500 or Timeout = Retryable (Standard Error)
        throw new Error(errorMessage);
      }

      // Unknown error
      handleAxiosException(error, this.logger, `${to} - ${targetUrl}`);
    }
  }
}
