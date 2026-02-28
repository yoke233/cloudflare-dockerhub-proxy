# Cloudflare Docker Hub + GHCR Proxy

一个基于 Cloudflare Worker 的 Docker Hub + GHCR 代理。

## 特性

- 一个 Worker 同时支持 Docker Hub 和 GHCR
- 自动改写 `WWW-Authenticate` 与 CDN `Location` 头
- 支持通过 Wrangler 变量配置域名

## 部署

1. 复制 `wrangler.example.jsonc` 为 `wrangler.jsonc`
2. 将其中的 `your-domain.com` 和路由域名替换为你的域名
3. 执行部署

```bash
npx wrangler deploy
```

## 域名绑定

将以下域名绑定到同一个 Worker：

- `docker.your-domain.com`
- `auth-docker.your-domain.com`
- `production-docker.your-domain.com`
- `ghcr.your-domain.com`
- `production-ghcr.your-domain.com`

Docker daemon 镜像配置示例：

```json
{
  "registry-mirrors": ["https://docker.your-domain.com"]
}
```

GHCR 拉取示例：

```bash
docker pull ghcr.your-domain.com/<owner>/<repo>:<tag>
```

## License

本项目遵循 `Apache-2.0 license` 开源协议
