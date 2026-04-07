# ================================
# Oracle Cloud Infrastructure - Main Configuration
# ================================
# Arquitectura:
# - 1 VM Ampere ARM (2 OCPUs, 12GB RAM)
# - VCN con subnet pública
# - Security List (firewall) para acceso
# - Object Storage para documentos
# - Container Registry para imágenes Docker
# ================================

# ================================
# Data Sources
# ================================

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

data "oci_core_images" "os_image" {
  compartment_id           = var.tenancy_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "9"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# ================================
# Compartment
# ================================

resource "oci_identity_compartment" "main" {
  compartment_id = var.tenancy_ocid
  name           = var.compartment_name
  description    = "Compartment for Exam Generator application"

  freeform_tags = var.common_tags
}

# ================================
# Virtual Cloud Network (VCN)
# ================================

resource "oci_core_vcn" "main" {
  compartment_id = oci_identity_compartment.main.id
  cidr_block     = var.vcn_cidr
  display_name   = "${var.app_name}-vcn"
  dns_label      = "examgenvcn"

  freeform_tags = var.common_tags
}

# ================================
# Internet Gateway
# ================================

resource "oci_core_internet_gateway" "main" {
  compartment_id = oci_identity_compartment.main.id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.app_name}-igw"
  enabled        = true

  freeform_tags = var.common_tags
}

# ================================
# Route Table
# ================================

resource "oci_core_default_route_table" "main" {
  manage_default_resource_id = oci_core_vcn.main.default_route_table_id

  route_rules {
    network_entity_id = oci_core_internet_gateway.main.id
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
  }
}

# ================================
# Security List (Firewall)
# ================================

resource "oci_core_security_list" "main" {
  compartment_id = oci_identity_compartment.main.id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.app_name}-security-list"

  # SSH - puerto 22
  ingress_security_rules {
    protocol  = "6" # TCP
    source    = "0.0.0.0/0"
    stateless = false

    tcp_options {
      min = 22
      max = 22
    }
  }

  # Frontend - puerto 80 (HTTP)
  ingress_security_rules {
    protocol  = "6" # TCP
    source    = "0.0.0.0/0"
    stateless = false

    tcp_options {
      min = 80
      max = 80
    }
  }

  # Frontend - puerto 443 (HTTPS)
  ingress_security_rules {
    protocol  = "6" # TCP
    source    = "0.0.0.0/0"
    stateless = false

    tcp_options {
      min = 443
      max = 443
    }
  }

  # Backend API - puerto 3001
  ingress_security_rules {
    protocol  = "6" # TCP
    source    = "0.0.0.0/0"
    stateless = false

    tcp_options {
      min = 3001
      max = 3001
    }
  }

  # Allow all outbound traffic
  egress_security_rules {
    protocol  = "all"
    destination = "0.0.0.0/0"
    stateless = false
  }

  freeform_tags = var.common_tags
}

# ================================
# Subnet
# ================================

resource "oci_core_subnet" "public" {
  compartment_id             = oci_identity_compartment.main.id
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = var.subnet_cidr
  display_name               = "${var.app_name}-public-subnet"
  dns_label                  = "public"
  security_list_ids          = [oci_core_security_list.main.id]
  route_table_id             = oci_core_vcn.main.default_route_table_id
  prohibit_public_ip_on_vnic = false
  availability_domain        = data.oci_identity_availability_domains.ads.availability_domains[0].name

  freeform_tags = var.common_tags
}

# ================================
# Compute Instance (Ampere ARM)
# ================================

resource "oci_core_instance" "main" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = oci_identity_compartment.main.id
  display_name        = "${var.app_name}-server"
  shape               = var.instance_shape

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_in_gbs
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.os_image.images[0].id
    boot_volume_size_in_gbs = 50
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    display_name     = "${var.app_name}-vnic"
    assign_public_ip = true
    hostname_label   = "examgen"
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data = base64encode(file("${path.module}/cloud-init.sh"))
  }

  freeform_tags = var.common_tags
}

# ================================
# Object Storage Bucket (para documentos)
# ================================

resource "oci_objectstorage_bucket" "documents" {
  compartment_id = oci_identity_compartment.main.id
  name           = "${var.app_name}-documents"
  namespace      = data.oci_objectstorage_namespace.ns.namespace
  access_type    = "NoPublicAccess"
  storage_tier   = "Standard"

  freeform_tags = var.common_tags
}

data "oci_objectstorage_namespace" "ns" {
  compartment_id = var.tenancy_ocid
}

# ================================
# Container Registry
# ================================

resource "oci_artifacts_container_repository" "backend" {
  compartment_id = oci_identity_compartment.main.id
  display_name   = "${var.app_name}-backend"
  is_immutable   = false
  is_public      = false
}

resource "oci_artifacts_container_repository" "frontend" {
  compartment_id = oci_identity_compartment.main.id
  display_name   = "${var.app_name}-frontend"
  is_immutable   = false
  is_public      = false
}
