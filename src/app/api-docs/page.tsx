"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { openApiSpec } from "@/lib/swagger/openapi";
import "swagger-ui-react/swagger-ui.css";

// Dynamic import with SSR disabled because SwaggerUI relies on browser window APIs.
// NOTE: swagger-ui-react's internal ModelCollapse class component uses
// UNSAFE_componentWillReceiveProps. This is a known upstream issue
// (https://github.com/swagger-api/swagger-ui/issues) that only appears in
// development console and does not affect production behaviour.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-10">
        <header className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                LUXORA API Documentation
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              OpenAPI 3.0 REST API interactive explorer &amp; schema specification
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg hover:bg-amber-400/20 transition-all"
            >
              Raw OpenAPI JSON
            </a>
            <Link
              href="/"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all"
            >
              Back to Store
            </Link>
          </div>
        </header>

        <div className="swagger-dark-theme rounded-xl overflow-hidden bg-white text-slate-900 p-2 md:p-6">
          <SwaggerUI spec={openApiSpec} docExpansion="list" filter={true} />
        </div>
      </div>
    </div>
  );
}
