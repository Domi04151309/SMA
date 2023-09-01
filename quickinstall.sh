#!/bin/bash
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# Prepare node
if ! [ -x "$(command -v node)" ]; then
  apt-get install -y ca-certificates curl gnupg
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  NODE_MAJOR=20
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
  apt-get update
fi

# Install needed packages
apt-get -y -f install nodejs build-essential git

# Create user
adduser --disabled-password --gecos "" sma
cd /home/sma

# Clone repository
git clone https://github.com/Domi04151309/SMA.git
cd SMA

# Install dependencies
npm ci --omit=dev

# Add autostart
tee /etc/systemd/system/sma.service << END
[Unit]
Description=SMA
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=sma
ExecStart=/usr/bin/node /home/sma/SMA/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
END
chmod 644 /etc/systemd/system/sma.service
systemctl enable sma

# Start server
systemctl start sma
