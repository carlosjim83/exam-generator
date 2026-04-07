#!/bin/bash
# Script para reintentar despliegue en Oracle Cloud hasta que haya capacidad
# Ejecutar: ./scripts/deploy-oracle.sh

cd terraform/oci

echo "=========================================="
echo "Desplegando en Oracle Cloud..."
echo "=========================================="
echo ""
echo "Este script reintentará automáticamente"
echo "hasta que haya capacidad disponible."
echo ""
echo "Puedes detenerlo con Ctrl+C"
echo ""

ATTEMPT=1
while true; do
    echo ""
    echo "=========================================="
    echo "Intento #$ATTEMPT - $(date)"
    echo "=========================================="

    # Intentar aplicar
    if tofu apply -auto-approve; then
        echo ""
        echo "=========================================="
        echo "¡DESPLIEGUE EXITOSO!"
        echo "=========================================="
        echo ""
        echo "Tu IP pública es:"
        tofu output instance_public_ip
        echo ""
        echo "Conecta por SSH:"
        tofu output ssh_command
        echo ""
        echo "URLs:"
        tofu output app_urls
        exit 0
    else
        echo ""
        echo "No hay capacidad disponible. Reintentando en 5 minutos..."
        echo "(Presiona Ctrl+C para cancelar)"
        sleep 10
        ATTEMPT=$((ATTEMPT + 1))
    fi
done
