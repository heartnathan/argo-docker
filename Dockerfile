FROM node:alpine3.20

# 1. 不要使用 /tmp，改用 /app
WORKDIR /app

# 2. 複製所有檔案到 /app
COPY . .

# 3. 安裝系統依賴與專案套件
# 移除了 chmod +x index.js，因為 node 指令不需要它
RUN apk update && apk upgrade && \
    apk add --no-cache openssl curl gcompat iproute2 coreutils bash && \
    npm install

# 4. 暴露埠號 (Render 通常會自動偵測，但寫著也無妨)
EXPOSE 3000

# 5. 啟動指令
CMD ["node", "index.js"]
