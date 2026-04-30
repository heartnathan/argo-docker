# nodejs-argo Proxy

A powerful Argo tunnel deployment tool designed for PaaS and toy platforms. Supports multiple protocols including VLESS, VMess, and Trojan.

## Disclaimer
* This project is for personal use only. Commercial use is strictly prohibited.
* Please comply with local laws and regulations. Avoid abuse as a public proxy.

## Features
* Designed for Node.js environments on PaaS platforms.
* Uses Argo tunnels for connectivity.
* Supports temporary tunnels (default) or fixed tunnels via `ARGO_DOMAIN` and `ARGO_AUTH`.

## Environment Variables
| Name | Required | Default | Description |
|------|----------|---------|-------------|
| PROJECT_URL | No | - | Project assigned URL |
| UUID | No | (Random) | User UUID |
| ARGO_DOMAIN | No | - | Fixed Argo domain |
| ARGO_AUTH | No | - | Argo Token or JSON |
| PORT | No | 3000 | HTTP Service Port |

## Usage
1. Upload `index.js` and `package.json`.
2. Configure environment variables in your platform.
3. Access `/sub` to get your subscription links.