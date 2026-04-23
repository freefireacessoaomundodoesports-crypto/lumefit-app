import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LUMEfit | Contador de Calorias" },
      {
        name: "description",
        content:
          "LUMEfit é um contador de calorias para mulheres moçambicanas que querem perder peso em casa.",
      },
      { property: "og:title", content: "LUMEfit | Contador de Calorias" },
      {
        property: "og:description",
        content:
          "Acompanha refeições moçambicanas, metas diárias e progresso semanal com uma experiência glassmorphism.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "LUMEfit | Contador de Calorias" },
      {
        name: "twitter:description",
        content: "Regista refeições, controla calorias e segue o teu progresso diário.",
      },
      { name: "description", content: "LUMEfit helps Mozambican women track calories and lose weight at home with a visually stunning interface." },
      { property: "og:description", content: "LUMEfit helps Mozambican women track calories and lose weight at home with a visually stunning interface." },
      { name: "twitter:description", content: "LUMEfit helps Mozambican women track calories and lose weight at home with a visually stunning interface." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/07cab7d9-d3e1-4a48-86ef-f87412271559/id-preview-1b714111--9f11a5fa-af36-4390-b060-e462fb2bfcaf.lovable.app-1776934270427.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/07cab7d9-d3e1-4a48-86ef-f87412271559/id-preview-1b714111--9f11a5fa-af36-4390-b060-e462fb2bfcaf.lovable.app-1776934270427.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "canonical", href: "/" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-MZ">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
