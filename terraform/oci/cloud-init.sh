#!/bin/bash
# Cloud-init script para configurar la VM de Oracle Cloud

set -e

echo "=== Configurando sistema ==="

# Detectar si es yum o dnf
if command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo "No se encontró dnf ni yum"
    exit 1
fi
echo "Usando package manager: $PKG_MANAGER"

# Actualizar paquetes
sudo $PKG_MANAGER update -y

# Instalar Docker
echo "=== Instalando Docker ==="
if [ "$PKG_MANAGER" = "yum" ]; then
    sudo yum install -y yum-utils
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo yum install -y docker-ce docker-ce-cli containerd.io
else
    sudo dnf install -y docker
fi

sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker opc

# Instalar Docker Compose
echo "=== Instalando Docker Compose ==="
if [ "$PKG_MANAGER" = "yum" ]; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
else
    sudo dnf install -y docker-compose
fi

echo "=== Setup base completado ==="
echo "Ahora copia los archivos docker-compose.yml, nginx.conf y .env a /home/opc/app"
