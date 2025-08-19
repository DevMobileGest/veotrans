#!/bin/bash
set -e

# ============================
# VARIABLES
# ============================
IFACE_LAN="enp2s0"
IFACE_WAN="enp1s0"
IP="192.168.31.191"
DOMAIN="veotrans.com"
DNS="$IP"
NODE_APP_DIR="/opt/veotrans"

# ============================
# CONFIGURACIÓN DE RED
# ============================
echo "[1/6] Configurando IP estática en $IFACE_LAN..."
cat <<EOF >/etc/netplan/01-$IFACE_LAN.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    $IFACE_LAN:
      dhcp4: no
      addresses: [$IP/24]
      nameservers:
        addresses: [$DNS,8.8.8.8]
        search: [$DOMAIN]
EOF

netplan apply

# ============================
# INSTALAR PAQUETES
# ============================
echo "[2/6] Instalando paquetes necesarios..."
apt update
apt install -y isc-dhcp-server filezilla bind9 bind9utils bind9-dnsutils iptables-persistent curl git

# ============================
# CONFIGURAR DHCP
# ============================
echo "[3/6] Configurando DHCP..."
cat <<EOF >/etc/dhcp/dhcpd.conf
option domain-name "$DOMAIN";
option domain-name-servers $IP;

default-lease-time 600;
max-lease-time 7200;
authoritative;

subnet 192.168.31.0 netmask 255.255.255.0 {
  range 192.168.31.100 192.168.31.200;
  option routers $IP;
  option broadcast-address 192.168.31.255;
}
EOF

sed -i "s/^INTERFACESv4.*/INTERFACESv4=\"$IFACE_LAN\"/" /etc/default/isc-dhcp-server

systemctl enable isc-dhcp-server
systemctl restart isc-dhcp-server

# ============================
# CONFIGURAR DNS (BIND9)
# ============================
echo "[4/6] Configurando Bind9 (DNS local)..."
cat <<EOF >/etc/bind/named.conf.local
zone "$DOMAIN" {
    type master;
    file "/etc/bind/db.$DOMAIN";
};
EOF

cat <<EOF >/etc/bind/db.$DOMAIN
\$TTL    604800
@       IN      SOA     ns.$DOMAIN. admin.$DOMAIN. (
                        3         ; Serial
                        604800    ; Refresh
                        86400     ; Retry
                        2419200   ; Expire
                        604800 )  ; Negative Cache TTL

; Servidor DNS
@       IN      NS      ns.$DOMAIN.

; Resolución principal
ns      IN      A       $IP
@       IN      A       $IP
www     IN      A       $IP
EOF

systemctl enable bind9
systemctl restart bind9

# ============================
# CONFIGURAR NAT (IPTABLES)
# ============================
echo "[5/6] Configurando NAT en $IFACE_WAN para LAN $IFACE_LAN..."

sysctl -w net.ipv4.ip_forward=1
sed -i 's/^#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf

iptables -t nat -A POSTROUTING -o $IFACE_WAN -j MASQUERADE
iptables -A FORWARD -i $IFACE_WAN -o $IFACE_LAN -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i $IFACE_LAN -o $IFACE_WAN -j ACCEPT

netfilter-persistent save
netfilter-persistent reload

# ============================
# INSTALAR NODE.JS + APP
# ============================
echo "[6/6] Instalando Node.js y clonando aplicación..."
apt install -y nodejs npm

# Clonar el repositorio
if [ -d "$NODE_APP_DIR" ]; then
    echo "Directorio $NODE_APP_DIR ya existe, eliminando..."
    rm -rf $NODE_APP_DIR
fi

git clone https://github.com/DevMobileGest/veotrans.git $NODE_APP_DIR
cd $NODE_APP_DIR

# Instalar dependencias (usa package-lock si existe)
if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi

# Detectar puerto del proyecto (si tiene variable PORT en .env usa esa)
APP_PORT=80
if grep -q "^PORT=" .env 2>/dev/null; then
    APP_PORT=$(grep "^PORT=" .env | cut -d'=' -f2)
fi

# Crear servicio systemd
cat <<EOF >/etc/systemd/system/veotrans.service
[Unit]
Description=Servidor Node.js VeoTrans
After=network.target

[Service]
ExecStart=/usr/bin/node $NODE_APP_DIR/app.js
Restart=always
User=nobody
Environment=NODE_ENV=production PORT=$APP_PORT

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reexec
systemctl enable veotrans
systemctl start veotrans

# ============================
# FIN
# ============================
echo "======================================"
echo "SERVIDOR GATEWAY + NODE.JS CONFIGURADO 🎉"
echo "LAN ($IFACE_LAN) -> $IP"
echo "WAN ($IFACE_WAN) -> salida a Internet"
echo "Dominio local: $DOMAIN"
echo "Web Node.js en: http://$DOMAIN"
echo "DHCP: 192.168.31.100 - 192.168.31.200"
echo "======================================"
