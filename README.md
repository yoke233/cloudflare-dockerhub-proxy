# Cloudflare Docker Hub + GHCR Proxy

A Cloudflare Worker proxy for Docker Hub and GHCR.

[中文版README](README_zh.md)

## Features

- One Worker supports both Docker Hub and GHCR
- Rewrites `WWW-Authenticate` and CDN `Location` headers
- Domain settings can be configured via Wrangler vars

## Setup

1. Copy `wrangler.example.jsonc` to `wrangler.jsonc`
2. Replace `your-domain.com` and route domains with your own
3. Deploy:

```bash
npx wrangler deploy
```

## Usage

Bind these custom domains to one Worker:

- `docker.your-domain.com`
- `auth-docker.your-domain.com`
- `production-docker.your-domain.com`
- `ghcr.your-domain.com`
- `production-ghcr.your-domain.com`

Docker daemon mirror example:

```json
{
  "registry-mirrors": ["https://docker.your-domain.com"]
}
```

GHCR example:

```bash
docker pull ghcr.your-domain.com/<owner>/<repo>:<tag>
```

## License

This project is open-sourced under the `Apache-2.0 license`.
