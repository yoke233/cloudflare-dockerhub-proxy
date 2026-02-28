const DEFAULT_ROOT_DOMAIN = "your-domain.com";

function buildConfig(env) {
  const rootDomain = (env.ROOT_DOMAIN || DEFAULT_ROOT_DOMAIN).trim().toLowerCase();

  const dockerBase = env.DOCKER_BASE_DOMAIN || `docker.${rootDomain}`;
  const dockerAuth = env.DOCKER_AUTH_DOMAIN || `auth-${dockerBase}`;
  const dockerCdn = env.DOCKER_CDN_DOMAIN || `production-${dockerBase}`;

  const ghcrBase = env.GHCR_BASE_DOMAIN || `ghcr.${rootDomain}`;
  const ghcrCdn = env.GHCR_CDN_DOMAIN || `production-${ghcrBase}`;

  return {
    domains: {
      dockerBase,
      dockerAuth,
      dockerCdn,
      ghcrBase,
      ghcrCdn,
    },
    upstream: {
      dockerRegistry: "https://registry-1.docker.io",
      dockerAuth: "https://auth.docker.io",
      dockerCdn: "https://production.cloudflare.docker.com",
      ghcrRegistry: "https://ghcr.io",
      ghcrAuth: "https://ghcr.io/token",
      ghcrCdn: "https://pkg-containers.githubusercontent.com",
    },
  };
}

function resolveTarget(url, config) {
  const { domains, upstream } = config;

  if (url.hostname === domains.dockerBase) {
    return new URL(upstream.dockerRegistry + url.pathname + url.search);
  }

  if (url.hostname === domains.dockerAuth) {
    return new URL(upstream.dockerAuth + url.pathname + url.search);
  }

  if (url.hostname === domains.dockerCdn) {
    return new URL(upstream.dockerCdn + url.pathname + url.search);
  }

  if (url.hostname === domains.ghcrBase) {
    if (url.pathname.startsWith("/auth")) {
      const authPath = url.pathname.slice("/auth".length);
      return new URL(upstream.ghcrAuth + authPath + url.search);
    }
    return new URL(upstream.ghcrRegistry + url.pathname + url.search);
  }

  if (url.hostname === domains.ghcrCdn) {
    return new URL(upstream.ghcrCdn + url.pathname + url.search);
  }

  return null;
}

function rewriteHeaders(responseHeaders, config) {
  const { domains, upstream } = config;
  const headers = new Headers(responseHeaders);

  if (headers.has("WWW-Authenticate")) {
    const original = headers.get("WWW-Authenticate");
    if (original) {
      headers.set(
        "WWW-Authenticate",
        original
          .replaceAll(upstream.dockerAuth, `https://${domains.dockerAuth}`)
          .replaceAll(upstream.ghcrAuth, `https://${domains.ghcrBase}/auth`)
      );
    }
  }

  if (headers.has("Location")) {
    const original = headers.get("Location");
    if (original) {
      headers.set(
        "Location",
        original
          .replaceAll(upstream.dockerCdn, `https://${domains.dockerCdn}`)
          .replaceAll(upstream.ghcrCdn, `https://${domains.ghcrCdn}`)
      );
    }
  }

  return headers;
}

function statusHtml(config) {
  const { domains } = config;
  return `
<h1>Cloudflare DockerHub/GHCR Proxy is Running</h1>
<h3>Docker Hub</h3>
<p>Base: ${domains.dockerBase}</p>
<p>Auth: ${domains.dockerAuth}</p>
<p>CDN: ${domains.dockerCdn}</p>
<h3>GHCR</h3>
<p>Base: ${domains.ghcrBase}</p>
<p>CDN: ${domains.ghcrCdn}</p>`;
}

export default {
  async fetch(request, env) {
    const config = buildConfig(env || {});
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(statusHtml(config), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    const target = resolveTarget(url, config);
    if (!target) {
      return new Response(`Host not configured: ${url.hostname}`, { status: 404 });
    }

    const newRequest = new Request(target, request);
    newRequest.headers.set("Host", target.hostname);

    const response = await fetch(newRequest);
    const headers = rewriteHeaders(response.headers, config);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
