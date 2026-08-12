import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    if (event.request?.data) {
      if (typeof event.request.data === "object") {
        const data = { ...(event.request.data as Record<string, unknown>) };
        delete data.password;
        delete data.passwordHash;
        delete data.token;
        delete data.creditCard;
        delete data.secret;
        event.request.data = data;
      }
    }
    return event;
  },
});
