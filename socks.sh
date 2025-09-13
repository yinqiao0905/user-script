#!/bin/bash
DEFAULT_START_PORT=8800                         #默认起始端口
DEFAULT_SOCKS_USERNAME="username"                   #默认socks账号
DEFAULT_SOCKS_PASSWORD="password"               #默认socks密码
IP_ADDRESSES=($(hostname -I))

install_xray() {
	echo "安装 Xray..."
	apt-get install unzip -y || yum install unzip -y
	wget https://github.com/XTLS/Xray-core/releases/download/v25.8.3/Xray-linux-64.zip
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
