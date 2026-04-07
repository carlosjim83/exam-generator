# ================================
# Oracle Cloud Infrastructure - Outputs
# ================================

output "compartment_id" {
  description = "ID del compartment creado"
  value       = oci_identity_compartment.main.id
}

output "compartment_name" {
  description = "Nombre del compartment"
  value       = oci_identity_compartment.main.name
}

output "instance_public_ip" {
  description = "IP pública de la instancia"
  value       = oci_core_instance.main.public_ip
}

output "instance_private_ip" {
  description = "IP privada de la instancia"
  value       = oci_core_instance.main.private_ip
}

output "instance_id" {
  description = "OCID de la instancia"
  value       = oci_core_instance.main.id
}

output "bucket_name" {
  description = "Nombre del bucket de Object Storage"
  value       = oci_objectstorage_bucket.documents.name
}

output "bucket_namespace" {
  description = "Namespace del Object Storage (necesario para acceder al bucket)"
  value       = data.oci_objectstorage_namespace.ns.namespace
}

output "container_registry_backend" {
  description = "Nombre del repositorio de backend"
  value       = oci_artifacts_container_repository.backend.display_name
}

output "container_registry_frontend" {
  description = "Nombre del repositorio de frontend"
  value       = oci_artifacts_container_repository.frontend.display_name
}

output "vcn_id" {
  description = "ID de la VCN"
  value       = oci_core_vcn.main.id
}

output "ssh_command" {
  description = "Comando para conectar por SSH"
  value       = "ssh -i ~/.ssh/id_rsa opc@${oci_core_instance.main.public_ip}"
}

output "app_urls" {
  description = "URLs de la aplicación"
  value = {
    frontend = "http://${oci_core_instance.main.public_ip}:3000"
    backend  = "http://${oci_core_instance.main.public_ip}:3001"
    nginx    = "http://${oci_core_instance.main.public_ip}"
  }
}

output "deployment_notes" {
  description = "Notas de despliegue"
  value = <<-EOF
    ===========================================
    ORACLE CLOUD DEPLOYMENT READY!
    ===========================================

    1. Conectar por SSH:
       ssh -i ~/.ssh/id_rsa opc@${oci_core_instance.main.public_ip}

    2. URLs de la aplicación:
       - Frontend: http://${oci_core_instance.main.public_ip}:3000
       - Backend: http://${oci_core_instance.main.public_ip}:3001

    ===========================================
  EOF
}
