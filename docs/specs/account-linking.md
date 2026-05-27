# Spec: Account Linking (OAuth to Local)

## Overview

Permitir a los usuarios con cuentas registradas localmente (email/contraseña) vincular su cuenta de Google OAuth. Esto elimina el error 409 "Email already registered with LOCAL provider" y permite login con cualquier método.

## Requirements

- Un usuario que creó cuenta con email/contraseña debe poder loguearse con Google sin crear cuenta nueva
- La vinculación debe ser automática y transparente al usuario
- El usuario debe poder loguearse con cualquiera de los dos métodos después
- Debe funcionar con cookies cross-subdomain (Domain=.formydable.es)

## Domain Model

- No nuevas entidades de dominio. Reutilizar `User` existente.
- Añadir tabla `OAuthAccount` en Prisma para soporte multi-provider por usuario.

## API Endpoints

- **Modificado**: `GET /api/auth/google/callback` — en lugar de 409 cuando el email existe con provider LOCAL, vincular automáticamente y continuar el flujo de login.

## Database Schema

```prisma
model OAuthAccount {
  id                String @id @default(uuid())
  userId            String @map("user_id")
  provider          String // 'google', 'github', 'microsoft'
  providerAccountId String @map("provider_account_id")
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@map("oauth_accounts")
}
```

## Changes

### Backend

1. **Prisma schema**: añadir modelo `OAuthAccount`
2. **Migration**: crear tabla `oauth_accounts`
3. **oauth.routes.ts**: modificar callback para:
   - Si email existe con provider LOCAL → crear OAuthAccount y continuar login
   - Si email existe con provider GOOGLE → login normal
   - Si no existe → crear usuario nuevo (comportamiento actual)
4. **Tests**: unit tests para los tres casos

### Frontend

Ninguno. El flujo UX es idéntico para el usuario.

## Testing Strategy

- Unit tests para `oauth.routes.ts` con los tres escenarios
- Verificar que el usuario logueado tiene `provider: LOCAL` pero `OAuthAccount` asociado
- Verificar que puede hacer login con ambos métodos

## Acceptance Criteria

- [ ] Usuario con cuenta LOCAL puede hacer login con Google por primera vez
- [ ] Tras vincular, puede loguearse con Google o email/contraseña
- [ ] No se crea duplicado de usuario
- [ ] Los datos existentes (exámenes, clases) permanecen intactos
