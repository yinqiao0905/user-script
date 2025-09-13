#!/bin/bash
#
# socks-unified.sh
# 一个集安装、配置、开机自启功能于一体的 SOCKS5 代理部署脚本
#

set -e

# --- 配置参数 ---
DEFAULT_START_PORT=8800
DEFAULT_SOCKS_USERNAME="username"
DEFAULT_SOCKS_PASSWORD="password"

# --- 脚本自身和服务定义 ---
SCRIPT_SELF_PATH="/usr/local/bin/socks-unified.sh"
SERVICE_NAME="socks-init"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

#================================================================
# XRAY 安装与配置逻辑 (原 socks.sh 的核心功能)
#================================================================

install_xray() {
	echo "--> 正在安装 Xray..."
	apt-get install unzip -y || yum install unzip -y
	wget https://github.com/XTLS/Xray-core/releases/download/v1.8.3/Xray-linux-64.zip -O /tmp/xray.zip
	unzip /tmp/xray.zip -d /tmp/
	mv /tmp/xray /usr/local/bin/xrayL
	chmod +x /usr/local/bin/xrayL
	rm -f /tmp/xray.zip /tmp/xray
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
	echo "--> Xray 安装完成."
}

config_xray() {
    echo "--> 正在配置 SOCKS5 代理..."
	IP_ADDRESSES=($(hostname -I))
	if [ -z "$IP_ADDRESSES" ]; then
		echo "错误：无法获取到 IP 地址。"
		exit 1
	fi

	mkdir -p /etc/xrayL
	START_PORT=$DEFAULT_START_PORT
	SOCKS_USERNAME=$DEFAULT_SOCKS_USERNAME
	SOCKS_PASSWORD=$DEFAULT_SOCKS_PASSWORD
	
    # 清空旧配置
    config_content=""

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
	
    echo "--> SOCKS5 配置生成完成。"
	echo "    起始端口: $START_PORT"
	echo "    结束端口: $(($START_PORT + $i - 1))"
	echo "    SOCKS账号: $SOCKS_USERNAME"
	echo "    SOCKS密码: $SOCKS_PASSWORD"
}

run_config_logic() {
	if [ -x /usr/local/bin/xrayL ]; then
		echo "--> XrayL 已安装，跳过安装步骤。"
	else
		install_xray
	fi
	config_xray
}

#================================================================
# 开机自启服务安装逻辑 (原 install-socks-init.sh 的核心功能)
#================================================================

setup_service() {
    echo "--> 正在设置开机自启服务..."
	# 将脚本自身复制到目标路径
	cp "$0" "$SCRIPT_SELF_PATH"
	chmod +x "$SCRIPT_SELF_PATH"

	# 创建 systemd 服务文件
	cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Run unified socks script at boot to generate XrayL config
After=network.target

[Service]
Type=oneshot
ExecStart=$SCRIPT_SELF_PATH run_at_boot
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
EOF

	systemctl daemon-reload
	systemctl enable "$SERVICE_NAME"
    echo "--> 开机自启服务 '$SERVICE_NAME' 创建并启用成功。"
}


#================================================================
# 主函数：根据参数判断执行何种逻辑
#================================================================

main() {
	if [ "$1" == "run_at_boot" ]; then
		# 如果参数是 'run_at_boot'，说明是开机时由 systemd 调用
		# 只执行配置更新逻辑
		run_config_logic
	else
		# 如果没有参数，说明是用户手动执行，进行首次安装
		if [ "$(id -u)" != "0" ]; then
			echo "错误：首次安装需要以 root 权限运行此脚本。"
			exit 1
		fi
		setup_service
		echo
		echo "--> 正在执行首次配置..."
		run_config_logic
		echo
		echo "============================================="
		echo "      SOCKS5 代理部署完成！"
        echo "============================================="
        echo "脚本已安装到 $SCRIPT_SELF_PATH"
        echo "并已设置为开机自动执行。"

	fi
}

main "$@" 