# ================================
# Oracle Cloud Infrastructure - Variables
# ================================

# ================================
# OCI Authentication
# ================================

variable "tenancy_ocid" {
  description = "OCID de la tenancy de OCI"
  type        = string
}

variable "user_ocid" {
  description = "OCID del usuario de OCI"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint de la API Key"
  type        = string
}

variable "private_key_path" {
  description = "Ruta al archivo de clave privada de la API"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "Región de OCI (eu-madrid-1 para España)"
  type        = string
  default     = "eu-madrid-1"
}

# ================================
# Compartment
# ================================

variable "compartment_ocid" {
  description = "OCID del compartment (dejar vacío para usar root compartment)"
  type        = string
  default     = ""
}

variable "compartment_name" {
  description = "Nombre del compartment para los recursos"
  type        = string
  default     = "exam-generator"
}

# ================================
# Networking
# ================================

variable "vcn_cidr" {
  description = "CIDR block para la VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "CIDR block para la subnet pública"
  type        = string
  default     = "10.0.1.0/24"
}

# ================================
# Compute Instance
# ================================

variable "instance_shape" {
  description = "Shape de la instancia (VM.Standard.A1.Flex para Ampere ARM)"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  description = "Número de OCPUs para la instancia (máx 4 en Free Tier)"
  type        = number
  default     = 2
}

variable "instance_memory_in_gbs" {
  description = "Memoria en GB para la instancia (máx 24 en Free Tier)"
  type        = number
  default     = 12
}

variable "ssh_public_key_path" {
  description = "Ruta a la clave SSH pública para acceder a la instancia"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# ================================
# Application Configuration
# ================================

variable "app_name" {
  description = "Nombre de la aplicación"
  type        = string
  default     = "exam-generator"
}

variable "environment" {
  description = "Entorno (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "db_password" {
  description = "Contraseña para PostgreSQL"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret para JWT"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "Secret para JWT refresh tokens"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

# Ollama Configuration (AI local)
variable "ollama_api_key" {
  description = "API key de Ollama Cloud (https://cloud.ollama.com)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ollama_model" {
  description = "Modelo de Ollama para LLM (chat/generación de exámenes)"
  type        = string
  default     = "llama3.2"
}

variable "ollama_embedding_model" {
  description = "Modelo de Ollama para embeddings (RAG)"
  type        = string
  default     = "nomic-embed-text"
}

# ================================
# Common Tags
# ================================

variable "common_tags" {
  description = "Tags comunes para todos los recursos"
  type        = map(string)
  default = {
    Project     = "ExamGenerator"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
