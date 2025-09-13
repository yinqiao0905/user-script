#!/bin/bash

# install-socks-init.sh
# 用于将 /usr/local/bin/socks.sh 设置为 systemd 开机自启服务

set -e

SERVICE_NAME="socks-init"
SCRIPT_PATH="/usr/local/bin/socks.sh"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# 1. 检查 socks.sh 是否存在
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "错误：$SCRIPT_PATH 不存在，请先将 socks.sh 放到该路径下。"
    exit 1
fi

# 2. 确保 socks.sh 有执行权限
chmod +x "$SCRIPT_PATH"

# 3. 写入 systemd 服务单元文件
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Run socks.sh at boot to generate XrayL config
After=network.target

[Service]
Type=oneshot
ExecStart=$SCRIPT_PATH
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
EOF

# 4. 重新加载 systemd 配置
systemctl daemon-reload

# 5. 启用服务（开机自启）
systemctl enable "$SERVICE_NAME"

echo "---------------------------------------------"
echo "systemd 服务已创建并设置为开机自启：$SERVICE_NAME"
echo "服务文件路径：$SERVICE_FILE"
echo "脚本路径：$SCRIPT_PATH"
echo
echo "你可以用以下命令查看服务状态："
echo "  systemctl status $SERVICE_NAME"
echo
echo "重启服务器后，socks.sh 会自动执行。"
echo "---------------------------------------------"