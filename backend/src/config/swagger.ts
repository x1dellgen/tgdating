import swaggerJsdoc from "swagger-jsdoc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vibe Dating API",
      version: "1.0.0",
      description:
        "REST API для TMA-приложения знакомств Vibe Dating. " +
        "Все защищённые эндпоинты требуют JWT-токен в заголовке Authorization.",
    },
    servers: [
      {
        url: "/",
        description: "Текущий сервер",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT-токен, полученный через POST /api/auth/telegram",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Описание ошибки",
            },
          },
        },
      },
    },
  },
  apis: [
    path.resolve(__dirname, "..", "routes", "*.ts"),
    path.resolve(__dirname, "..", "server.ts"),
    // Для production (скомпилированные .js)
    path.resolve(__dirname, "..", "routes", "*.js"),
    path.resolve(__dirname, "..", "server.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
