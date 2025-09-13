# SOCKS5 代理一键部署与开机自启配置文档

本文档记录了如何创建一个自动化脚本 `socks.sh`，用于在 Linux 服务器上部署基于 Xray 的 SOCKS5 代理，并将其配置为开机自启服务，确保每次服务器启动时都能根据最新的 IP 地址生成正确的配置。

## 最终目标

1.  **自动化部署**：一键安装 Xray 并生成 SOCKS5 代理配置。
2.  **动态 IP 适配**：每次开机时，脚本能自动获取服务器当前的所有 IP 地址，并为每个 IP 地址创建一个 SOCKS5 代理端口。
3.  **开机自启**：将该自动化逻辑配置为 systemd 服务，确保在服务器重启后能自动运行，无需人工干预。
4.  **幂等性**：脚本可以重复执行，如果检测到 Xray 已安装，则跳过安装步骤。

---

## 操作步骤

### 1. 主脚本 `socks.sh`

这是核心的自动化部署脚本，负责安装 Xray 和生成配置文件。

**路径**：`/usr/local/bin/socks.sh`

**最终代码**：
```bash
#!/bin/bash
DEFAULT_START_PORT=8800                         #默认起始端口
DEFAULT_SOCKS_USERNAME="username"                   #默认socks账号
DEFAULT_SOCKS_PASSWORD="password"               #默认socks密码
IP_ADDRESSES=($(hostname -I))

install_xray() {
	echo "安装 Xray..."
	apt-get install unzip -y || yum install unzip -y
	wget https://github.com/XTLS/Xray-core/releases/download/v1.8.3/Xray-linux-64.zip
	unzip Xray-linux-64.zip
	mv xray /usr/local/bin/xrayL
	chmod +x /usr/local/bin/xrayL
	cat <<EOF >/etc/systemd/system/xrayL.service
[Unit]
Description=XrayL Service
After=network.target

[Service]
ExecStart=/usr/local/bin/xrayL -c /etc/xrayL/config.toml
Restart=on-failure
User=nobody
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
	systemctl daemon-reload
	systemctl enable xrayL.service
	systemctl start xrayL.service
	echo "Xray 安装完成."
}
config_xray() {
	mkdir -p /etc/xrayL
	START_PORT=$DEFAULT_START_PORT
	SOCKS_USERNAME=$DEFAULT_SOCKS_USERNAME
	SOCKS_PASSWORD=$DEFAULT_SOCKS_PASSWORD
	for ((i = 0; i < ${#IP_ADDRESSES[@]}; i++)); do
		config_content+="[[inbounds]]\n"
		config_content+="port = $((START_PORT + i))\n"
		config_content+="protocol = \"socks\"\n"
		config_content+="tag = \"tag_$((i + 1))\"\n"
		config_content+="[inbounds.settings]\n"
		config_content+="auth = \"password\"\n"
		config_content+="udp = true\n"
		config_content+="ip = \"${IP_ADDRESSES[i]}\"\n"
		config_content+="[[inbounds.settings.accounts]]\n"
		config_content+="user = \"$SOCKS_USERNAME\"\n"
		config_content+="pass = \"$SOCKS_PASSWORD\"\n"
		config_content+="[[outbounds]]\n"
		config_content+="sendThrough = \"${IP_ADDRESSES[i]}\"\n"
		config_content+="protocol = \"freedom\"\n"
		config_content+="tag = \"tag_$((i + 1))\"\n\n"
		config_content+="[[routing.rules]]\n"
		config_content+="type = \"field\"\n"
		config_content+="inboundTag = \"tag_$((i + 1))\"\n"
		config_content+="outboundTag = \"tag_$((i + 1))\"\n\n\n"
	done
	echo -e "$config_content" >/etc/xrayL/config.toml
	systemctl restart xrayL.service
	systemctl --no-pager status xrayL.service
	echo ""
	echo "生成 socks 配置完成"
	echo "起始端口:$START_PORT"
	echo "结束端口:$(($START_PORT + $i - 1))"
	echo "socks账号:$SOCKS_USERNAME"
	echo "socks密码:$SOCKS_PASSWORD"
	echo ""
}
main() {
	if [ -x /usr/local/bin/xrayL ]; then
		echo "XrayL 已安装，跳过安装步骤。"
	else
		install_xray
	fi
	config_xray
}
main "$@"
```

### 2. 开机自启服务配置脚本 `install-socks-init.sh`

这个辅助脚本用于创建 `systemd` 服务，让 `socks.sh` 能够开机自动执行。

**功能**：
- 创建 `/etc/systemd/system/socks-init.service` 文件。
- 重新加载 `systemd` 配置并启用该服务。

**代码**：
```bash
#!/bin/bash
set -e

SERVICE_NAME="socks-init"
SCRIPT_PATH="/usr/local/bin/socks.sh"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

if [ ! -f "$SCRIPT_PATH" ]; then
    echo "错误：$SCRIPT_PATH 不存在，请先将 socks.sh 放到该路径下。"
    exit 1
fi

chmod +x "$SCRIPT_PATH"

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

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

echo "---------------------------------------------"
echo "systemd 服务已创建并设置为开机自启：$SERVICE_NAME"
echo "你可以用 'sudo systemctl status $SERVICE_NAME' 查看服务状态。"
echo "---------------------------------------------"
```

---

## 如何使用

1.  **上传主脚本**：将 `socks.sh` 的内容保存并上传到服务器的 `/usr/local/bin/socks.sh`。
2.  **上传并运行服务配置脚本**：将 `install-socks-init.sh` 上传到服务器任意位置（例如 `/tmp`），然后以 `root` 权限执行：
    ```sh
    chmod +x /tmp/install-socks-init.sh
    sudo /tmp/install-socks-init.sh
    ```
3.  **重启并验证**：重启服务器 `sudo reboot`。待服务器启动后，登录并检查 `XrayL` 服务和 `socks-init` 服务的状态。

---

## 故障排查

在配置过程中，我们遇到了 `socks-init.service` 启动失败的问题（`status=203/EXEC`）。

**原因**：`socks.sh` 脚本文件缺少 Shebang（`#!/bin/bash`），导致 `systemd` 不知道如何执行它。

**解决方案**：在 `socks.sh` 文件的第一行添加 `#!/bin/bash`。

我们也遇到了安装逻辑重复执行的问题。

**原因**：通过 `command -v xrayL` 检查安装状态时，在 `systemd` 的最小化 `PATH` 环境中可能找不到命令。

**解决方案**：将判断条件修改为直接检查文件路径 `[ -x /usr/local/bin/xrayL ]`。

### 查看日志

如果开机自启服务 `socks-init.service` 出现问题，可以使用以下命令查看其执行日志，定位问题：

```sh
sudo journalctl -u socks-init.service -b
```
**注意**：必须使用 `sudo` 执行，否则会因权限不足而无法读取日志。
