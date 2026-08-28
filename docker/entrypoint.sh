#!/bin/sh
set -eu

runtime_config_path=/usr/share/nginx/html/runtime-config.js

require_url() {
  name=$1
  value=$2

  if ! printf '%s' "$value" | grep -Eq '^https?://[^[:space:]"\\]+$'; then
    printf '%s must be an absolute HTTP(S) URL without whitespace, quotes, or backslashes.\n' "$name" >&2
    exit 1
  fi
}

github_url=${PLATFORM_GITHUB_URL:-https://github.com/Team-APE-RIP/APE}
discord_url=${PLATFORM_DISCORD_URL:-https://discord.gg/TaNYDC6kfJ}
qq_url=${PLATFORM_QQ_URL:-https://pd.qq.com/s/clcwlblcm?b=5}
bilibili_url=${PLATFORM_BILIBILI_URL:-https://space.bilibili.com/1220845388}
x_url=${PLATFORM_X_URL:-https://x.com/TeamAPEOfficial}

require_url PLATFORM_GITHUB_URL "$github_url"
require_url PLATFORM_DISCORD_URL "$discord_url"
require_url PLATFORM_QQ_URL "$qq_url"
require_url PLATFORM_BILIBILI_URL "$bilibili_url"
require_url PLATFORM_X_URL "$x_url"

printf 'window.__APE_RUNTIME_CONFIG__ = {"platformUrls":{"github":"%s","discord":"%s","qq":"%s","bilibili":"%s","x":"%s"}};\n' \
  "$github_url" "$discord_url" "$qq_url" "$bilibili_url" "$x_url" > "$runtime_config_path"

exec "$@"
