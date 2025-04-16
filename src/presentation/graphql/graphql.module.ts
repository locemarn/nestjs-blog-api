import { HttpStatus, Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import * as process from 'node:process';
import { GraphQLError, GraphQLFormattedError } from 'graphql/error';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPlugin } from '@apollo/server';
import { UserNotFoundException } from 'src/domain/exceptions/domain.exceptions';
import { EmailAlreadyExistsException } from 'src/application/user/exceptions/email-already-exists.exception';
import { HttpException } from '@nestjs/common';

// Helper function for safe status code extraction
function getStatusCodeFromError(error: unknown): number | undefined {
  if (error instanceof HttpException) {
    return error.getStatus();
  }
  // Check for generic structure like { response: { statusCode: number } }
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'statusCode' in error.response &&
    typeof error.response.statusCode === 'number'
  ) {
    return error.response.statusCode;
  }
  return undefined; // Not found or not a number
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false,
      plugins: [
        process.env.NODE_ENV !== 'production'
          ? ApolloServerPluginLandingPageLocalDefault({ embed: true })
          : undefined,
      ].filter(Boolean) as ApolloServerPlugin<any>[],
      formatError: (
        formattedError: GraphQLFormattedError,
        error: unknown,
      ): GraphQLFormattedError => {
        // --- Start Error Analysis ---
        console.error('Raw Error:', error);

        let message = formattedError.message;
        const extensions = formattedError.extensions
          ? { ...formattedError.extensions }
          : {};
        let statusCode: number | undefined;

        const originalError =
          (error instanceof GraphQLError ? error.originalError : error) ||
          error;

        // --- Apply Customizations Based on Error Type ---

        if (originalError instanceof UserNotFoundException) {
          message = originalError.message;
          extensions.code = 'NOT_FOUND';
          statusCode = HttpStatus.NOT_FOUND;
        } else if (originalError instanceof EmailAlreadyExistsException) {
          message = originalError.message;
          extensions.code = 'CONFLICT';
          statusCode = HttpStatus.CONFLICT;
        } else if (originalError instanceof HttpException) {
          statusCode = originalError.getStatus();
          message = originalError.message;

          if (statusCode && statusCode === (HttpStatus.BAD_REQUEST as number)) {
            const response = originalError.getResponse();
            extensions.code = 'BAD_USER_INPUT';

            if (
              typeof response === 'object' &&
              response !== null &&
              'message' in response
            ) {
              extensions.validationErrors = response.message;
              // Overwrite generic message with first validation error if helpful
              // if (Array.isArray(response.message) && response.message.length > 0) {
              //   message = response.message[0];
              // } else if (typeof response.message === 'string') {
              //   message = response.message;
              // }
            }
          } else {
            // Assign a generic code based on status for other HTTP errors
            extensions.code = extensions.code || `HTTP_${statusCode}`;
          }
        } else if (originalError instanceof Error) {
          // Handle generic JavaScript errors
          message = originalError.message; // Keep original message
          // Try to extract status code using the helper as a fallback
          statusCode = getStatusCodeFromError(originalError);
          // If a status code was found, reflect it in the code, otherwise default
          if (statusCode) {
            extensions.code = extensions.code || `HTTP_${statusCode}`;
          } else {
            extensions.code = extensions.code || 'INTERNAL_SERVER_ERROR';
          }
        } else {
          // Unknown error type - use defaults
          extensions.code = extensions.code || 'INTERNAL_SERVER_ERROR';
        }

        // Ensure a default code if none was set
        extensions.code = extensions.code || 'INTERNAL_SERVER_ERROR';

        // Add the determined status code to extensions (optional, but can be useful for clients)
        if (statusCode) {
          extensions.statusCode = statusCode;
        }

        // Clean sensitive data for production
        if (process.env.NODE_ENV === 'production') {
          delete extensions.stacktrace; // Common practice
          // Consider removing other potentially sensitive extension fields
          // delete extensions.exception;
        } else {
          // Add stacktrace in non-production for easier debugging (if not already present)
          if (!extensions.stacktrace && originalError instanceof Error) {
            extensions.stacktrace = originalError.stack?.split('\n');
          }
        }

        // --- Return the final formatted error ---
        const finalFormattedError = {
          ...formattedError, // Start with the base formatting
          message, // Use the potentially updated message
          extensions, // Use the potentially updated extensions
        };

        return finalFormattedError;
      },
    }),
  ],
})
export class AppGraphQLModule {}
