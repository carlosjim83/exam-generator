# Spec: Classes & Invitations System

**Date:** February 15, 2026
**Status:** Draft
**Priority:** CRITICAL (High)
**Related ADRs:** ADR 0009 (Clean Architecture), ADR 0004 (Authentication)

---

## Overview

**Problem:** Teachers cannot efficiently manage students. Current system requires teachers to know exact User IDs to assign exams, which is impractical. No class/group management exists.

**Solution:** Implement a class/group management system with:

- Teachers can create classes with unique codes
- Students join classes via access codes or email invitations
- Teachers can assign exams to entire classes instead of individual students
- Support for CSV bulk student import

**Target Users:**

- Teachers: Need to organize students and manage classes
- Students: Need to join classes quickly

---

## Requirements

### Functional Requirements

#### FR-1: Class Management (Teachers)

1. Teachers can create classes with a name
2. Each class has a unique 6-character access code (auto-generated)
3. Teachers can view all their classes
4. Teachers can delete classes (with confirmation)
5. Delete class removes all students enrolled in that class

#### FR-2: Student Enrollment

1. Students can join a class using the access code
2. Students can join classes via email invitation (create account or login + auto-join)
3. Teachers can bulk import students via CSV (email, name)
4. Students who haven't created accounts are listed as "pending"

#### FR-3: Email Invitations

1. Teachers can invite students by email
2. System sends email with unique token link
3. Invitation links expire after 7 days
4. System tracks invitation status (PENDING, ACCEPTED, EXPIRED)
5. Teachers can resend expired invitations

#### FR-4: Exam Assignment to Classes

1. Teachers can assign exams to entire classes
2. Teachers can exclude specific students from assignment
3. Due date can be set for class-wide assignment
4. All enrolled students receive the assignment

#### FR-5: Student Class Dashboard

1. Students can view all classes they're enrolled in
2. Students can leave a class (if allowed by teacher)

### Non-Functional Requirements

#### NFR-1: Scalability

- Supporting up to 1000 students per class
- Supporting up to 100 classes per teacher

#### NFR-2: Performance

- Class code generation < 100ms
- Student joining < 500ms
- Class listing with students < 1s

#### NFR-3: Security

- Access codes only for joining (not viewing)
- Email verification for invitations
- Rate limiting on class joins (5 attempts/minute per IP)

#### NFR-4: Usability

- Copy class code to clipboard
- QR code for quick student joining

---

## Domain Model

### Entities

#### Class (Clase)

```typescript
class Class {
  id: ClassId;
  teacherId: UserId;
  name: string; // "Math 101 - Group A"
  code: string; // "MAT101" (unique 6-8 chars)
  description?: string;
  color?: string; // Hex color for UI
  createdAt: Date;
  updatedAt: Date;

  // Business rules
  addStudent(studentId: UserId): void;
  removeStudent(studentId: UserId): void;
  hasStudent(studentId: UserId): boolean;
  getStudentCount(): number;
}
```

#### StudentEnrollment (Inscripción de Alumno)

```typescript
class StudentEnrollment {
  id: EnrollmentId;
  classId: ClassId;
  studentId: UserId;
  joinedAt: Date;
  leftAt?: Date; // Soft delete for enrollment history
  isActive: boolean; // true = currently enrolled
}
```

#### Invitation (Invitación Pendiente)

```typescript
class Invitation {
  id: InvitationId;
  classId: ClassId;
  teacherId: UserId;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  token: string; // UUID for email link
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}
```

### Value Objects

```typescript
class ClassId {
  value: UUID;
}

class EnrollmentId {
  value: UUID;
}

class InvitationId {
  value: UUID;
}

class ClassCode {
  value: string; // 6-8 uppercase letters/digits
  // Validation: unique, no confusing characters (O, 0, I, 1)
}
```

### Relationships

```
User (Teacher) 1 ---- Class N ---- StudentEnrollment N ---- User (Student N)
                          |
                          | N
                          |
                    Invitation N
```

---

## Use Cases

### UC-1: Create Class

**Actor:** Teacher
**Preconditions:** Teacher is authenticated

**Main Flow:**

1. Teacher navigates to "My Classes"
2. Teacher clicks "Create New Class"
3. Teacher enters class name (required) and description (optional)
4. System generates unique class code
5. System creates Class entity
6. Teacher sees new class with code and options to copy/QR
7. System creates "Class Created" event

**Alternatives:**

- Class name empty: Show validation error
- Class code collision: Retry generation (max 5 attempts)

### UC-2: Student Joins via Class Code

**Actor:** Student
**Preconditions:** Student is authenticated

**Main Flow:**

1. Student navigates to "/student/join"
2. Student enters class code
3. System validates code exists
4. System checks student is not already enrolled
5. System creates StudentEnrollment
6. Student sees "Successfully joined" message
7. Redirect to class dashboard

**Alternatives:**

- Code not found: Show "Invalid class code" error
- Already enrolled: Show "You're already a member"
- Class at capacity: Show "Class is full"

### UC-3: Teacher Invites Student via Email

**Actor:** Teacher
**Preconditions:** Teacher is authenticated, class exists

**Main Flow:**

1. Teacher opens class settings
2. Teacher clicks "Invite Students"
3. Teacher enters email(s) (up to 50 at once)
4. System creates Invitation entities with tokens
5. System sends emails with magic links
6. Teacher sees invitation tracking on class page

**Magic Link Flow:**

- Student clicks link → If logged in: auto-join → If not logged in: register/login → auto-join

### UC-4: Teacher Imports Students via CSV

**Actor:** Teacher
**Preconditions:** Teacher is authenticated, class exists

**Main Flow:**

1. Teacher opens class settings
2. Teacher uploads CSV (format: email,name)
3. System parses CSV
4. System validates emails (email format, duplicates)
5. System creates Invitation entities for each email
6. System queues emails to send (BullMQ worker)
7. Teacher sees import summary (success/fail count)

### UC-5: Assign Exam to Class

**Actor:** Teacher
**Preconditions:** Teacher is authenticated, class exists, exam exists

**Main Flow:**

1. Teacher opens exam
2. Teacher clicks "Assign to Class"
3. Teacher selects class(es)
4. Teacher optionally excludes specific students
5. Teacher sets due date (optional)
6. For each active student in class:
   - Create ExamAssignment
   - Link assignment to exam and student
7. Teacher sees confirmation with student count

**Alternatives:**

- No students in class: Show "Class has no students"
- Already assigned: Show "These students already have this exam assigned"

### UC-6: Student Views Assignments by Class

**Actor:** Student
**Preconditions:** Student is authenticated, enrolled in classes

**Main Flow:**

1. Student navigates to dashboard
2. Student sees list of enrolled classes
3. Student clicks class to see assignments for that class
4. System filters assignments by class
5. Student sees assignments grouped by status (pending, in progress, submitted)

---

## API Endpoints

### Classes

#### POST /api/classes

**Auth:** TEACHER
**Body:**

```typescript
{
  name: string
  description?: string
}
```

**Response:**

```typescript
{
  id: ClassId
  name: string
  code: string
  description?: string
  color?: string
  teacherId: UserId
  createdAt: Date
}
```

#### GET /api/classes

**Auth:** TEACHER
**Query:** `?page=1&limit=20&search=math`
**Response:**

```typescript
{
  classes: Class[]
  total: number
  page: number
  limit: number
}
```

#### GET /api/classes/:id

**Auth:** TEACHER (owner) or STUDENT (enrolled)
**Response:** Class with students count

#### GET /api/classes/code/:code

**Public** (for student join validation)
**Response:**

```typescript
{
  id: ClassId;
  name: string;
  teacherName: string;
  // Note: Doesn't include students list (privacy)
}
```

#### DELETE /api/classes/:id

**Auth:** TEACHER (owner)
**Response:** 204 No Content

### Students & Enrollments

#### GET /api/classes/:classId/students

**Auth:** TEACHER (owner)
**Query:** `?page=1&limit=20&search=john`
**Response:**

```typescript
{
  students: {
    id: UserId;
    email: string;
    firstName: string;
    lastName: string;
    joinedAt: Date;
    isActive: boolean;
  }
  [];
  total: number;
}
```

#### POST /api/classes/:classId/join

**Auth:** STUDENT
**Body:**

```typescript
{
  code: string; // Alternative: class code in URL param
}
```

**Response:**

```typescript
{
  classId: ClassId;
  joinedAt: Date;
}
```

#### DELETE /api/classes/:classId/students/:studentId

**Auth:** TEACHER (owner)
**Response:** 204 No Content

### Invitations

#### POST /api/classes/:classId/invitations

**Auth:** TEACHER (owner)
**Body:**

```typescript
{
  emails: string[]  // Max 50
}
```

**Response:**

```typescript
{
  invitations: {
    email: string;
    status: 'PENDING';
    expiresAt: Date;
  }
  [];
}
```

#### POST /api/classes/:classId/invitations/csv

**Auth:** TEACHER (owner)
**Body:** multipart/form-data with CSV file
**Response:**

```typescript
{
  imported: number
  failed: number
  errors: string[]
}
```

#### GET /api/classes/:classId/invitations

**Auth:** TEACHER (owner)
**Response:**

```typescript
{
  invitations: {
    id: InvitationId
    email: string
    status: string
    expiresAt: Date
    acceptedAt?: Date
  }[]
}
```

#### POST /api/invitations/:token/accept

**Auth:** None (if logged in, use session; if not, redirect to register/login)
**Response:** Redirect to class page after accepting

#### POST /api/invitations/:token/resend

**Auth:** TEACHER (owner of class)
**Response:** 204 No Content

### Bulk Assignments

#### POST /api/exams/:examId/assign-to-class

**Auth:** TEACHER (owner)
**Body:**

```typescript
{
  classIds: ClassId[]
  excludeStudentIds?: UserId[]
  dueDate?: ISODateTime
}
```

**Response:**

```typescript
{
  createdAssignments: number;
  skippedAssignments: number; // Already assigned
}
```

---

## Database Schema

### Tables

```sql
-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(8) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),  -- Hex color code (#RRGGBB)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_classes_teacher (teacher_id),
  INDEX idx_classes_code (code)
);

-- Student enrollments
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(class_id, student_id),
  INDEX idx_enrollments_class (class_id),
  INDEX idx_enrollments_student (student_id),
  INDEX idx_enrollments_active (class_id, is_active)
);

-- Email invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, ACCEPTED, EXPIRED, REVOKED
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_invitations_class (class_id),
  INDEX idx_invitations_token (token),
  INDEX idx_invitations_status (status)
);
```

### Migrations

```typescript
// migrations/YYYYMMDD_create_classes_table.ts
export async function up(prisma) {
  await prisma.$executeRaw`...SQL above...`;
}

export async function down(prisma) {
  await prisma.$executeRaw`DROP TABLE IF EXISTS invitations CASCADE`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS student_enrollments CASCADE`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS classes CASCADE`;
}
```

---

## UI Components

### Teacher - Classes Dashboard

#### Path: `/dashboard/classes`

**Components:**

1. `ClassesList` - Grid of class cards
2. `ClassCard` - Individual class display
3. `CreateClassModal` - Form to create new class
4. `CopyCodeButton` - Copy class code to clipboard
5. `QRCodeGenerator` - Display QR for quick student join

**Layout:**

```
+-----------------------------------------------------------+
| My Classes                                  [+ New Class] |
+-----------------------------------------------------------+
|                                                           |
|  ┌─────────────────────┐  ┌─────────────────────┐        |
|  │ Math 101            │  │ History 101        │        |
|  │ Code: MAT101       │  │ Code: HIS101       │        |
|  │ [📋 Copy] [📱 QR]  │  │ [📋 Copy] [📱 QR]  │        |
|  │ 👥 24 students     │  │ 👥 18 students     │        |
|  │ 📊 5 exams         │  │ 📊 3 exams         │        |
|  │ [View Details]     │  │ [View Details]     │        |
|  └─────────────────────┘  └─────────────────────┘        |
+-----------------------------------------------------------+
```

### Teacher - Class Detail

#### Path: `/dashboard/classes/:id`

**Tabs:**

1. Overview
2. Students
3. Exams
4. Invite

**Overview Tab:**

```
+-----------------------------------------------------------+
| Math 101 - Group A                          [⚙️ Settings] |
+-----------------------------------------------------------+
| Code: MAT101   [📋 Copy]  [📱 QR Display]                |
|                                                           |
| Stats:                                                    |
| • 24 students                                             |
| • 5 exams assigned                                       |
| • 12 assignments submitted                               |
| • Average score: 78%                                      |
+-----------------------------------------------------------+
```

**Students Tab:**

```
+-----------------------------------------------------------+
| Students                                   [+ Invite CSV] |
+-----------------------------------------------------------+
| Search: [                      ]                             |
+-----------------------------------------------------------+
| ☐ [Email]          [Name]       [Joined]      [Actions]   |
| ☐ john@email.com  John Doe     2024-02-15    [Remove]    |
| ☐ jane@email.com  Jane Smith   2024-02-10    [Remove]    |
+-----------------------------------------------------------+
| [Selected: 2]  [Remove Selected]  [Assign Exam]           |
+-----------------------------------------------------------+
```

**Invite Tab:**

```
+-----------------------------------------------------------+
| Invite Students                                           |
+-----------------------------------------------------------+
|                                                           |
| Option 1: Email Invitations                               |
| Enter emails (one per line):                              |
| ┌─────────────────────────────────────────────────┐       |
| │ student1@email.com                              │       |
| │ student2@email.com                              │       |
| └─────────────────────────────────────────────────┘       |
|                                                           |
| [Send Invitations]                                        |
|                                                           |
| Option 2: CSV Import                                      |
| Upload CSV file: [Browse...]                            |
| Expected format: email,name                               |
|                                                           |
| ┌─────────────────────────────────────────────────┐       |
| │ student1@email.com,John Doe                     │       |
| │ student2@email.com,Jane Smith                   │       |
| └─────────────────────────────────────────────────┘       |
|                                                           |
| [Import and Invite]                                       |
+-----------------------------------------------------------+
| Pending Invitations (15)                                  |
| ┌─────────────────────────────────────────────────┐       |
| │ student3@email.com  [Resend]                    │       |
| │ student4@email.com  [Resend]                    │       |
| └─────────────────────────────────────────────────┘       |
+-----------------------------------------------------------+
```

### Student - Join Class

#### Path: `/student/join`

**Layout:**

```
+-----------------------------------------------------------+
| 🎓 Join a Class                                           |
+-----------------------------------------------------------+
|                                                           |
|   Enter the class code from your teacher:                 |
|                                                           |
|   ┌─────────────────────────────────────────┐             |
|   │                                         │             |
|   +                                         +             |
|   +                                         +             |
|   +                                         +             |
|   │                                        │             |
|   └─────────────────────────────────────────┘             |
|                                                           |
|         [Join Class]                                      |
|                                                           |
|   📌 Don't have a code? Contact your teacher.            |
+-----------------------------------------------------------+
```

### Student - Class Dashboard

#### Path: `/student/classes/:id`

**Tabs:**

1. Assignments
2. Resources

**Assignments Tab:**

```
+-----------------------------------------------------------+
| Math 101 - Group A                   [Leave Class?]      |
+-----------------------------------------------------------+
|                                                           |
| Pending (3)                                               |
| ┌─────────────────────────────────────────┐             |
| │ 📄 Algebra Exam            [Start]     │             |
| │ Due: Feb 20, 2026                        │             |
| └─────────────────────────────────────────┘             |
|                                                           |
| In Progress (1)                                           |
| ┌─────────────────────────────────────────┐             |
| │ 📄 Geometry Quiz          [Continue]   │             |
| │ 5/10 questions answered                  │             |
| └─────────────────────────────────────────┘             |
|                                                           |
| Completed (2)                                             |
| ┌─────────────────────────────────────────┐             |
| │ ✅ Calculus Test (85/100)               │             |
| │ Completed: Feb 10, 2026                  │             |
| └─────────────────────────────────────────┘             |
+-----------------------------------------------------------+
```

---

## Testing Strategy

### Unit Tests

**Domain Layer:**

```typescript
// tests/domain/entities/Class.test.ts
describe('Class Entity', () => {
  it('should add student', () => { ... });
  it('should not add duplicate student', () => { ... });
  it('should enforce max 1000 students', () => { ... });
});

// tests/domain/value-objects/ClassCode.test.ts
describe('ClassCode Value Object', () => {
  it('should accept valid codes', () => { ... });
  it('should reject codes with confusing chars', () => { ... });
});
```

**Application Layer:**

```typescript
// tests/application/use-cases/CreateClassUseCase.test.ts
describe('CreateClassUseCase', () => {
  it('should create class and generate code', async () => { ... });
  it('should handle code collision', async () => { ... });
});

// tests/application/use-cases/StudentJoinUseCase.test.ts
describe('StudentJoinUseCase', () => {
  it('should allow student to join via code', async () => { ... });
  it('should reject duplicate enrollment', async () => { ... });
});
```

### Integration Tests

**Repository Tests:**

```typescript
// tests/infrastructure/persistence/PrismaClassRepository.test.ts
describe('PrismaClassRepository', () => {
  beforeAll(async () => { await setupTestDb(); });
  afterAll(async () => { await teardownTestDb(); });

  it('should save and retrieve class', async () => { ... });
  it('should find by code', async () => { ... });
});
```

**API Tests:**

```typescript
// tests/api/classes.routes.test.ts
describe('Classes API', () => {
  it('POST /classes should create class (teacher only)', async () => { ... });
  it('GET /classes should list teacher classes', async () => { ... });
  it('GET /classes/code/:code should validate class', async () => { ... });
  it('POST /classes/:id/join should enroll student', async () => { ... });
});
```

### E2E Tests

```typescript
// e2e/classes.spec.ts
describe('Class Management Flow', () => {
  it('teacher creates class and student joins', async () => {
    // Teacher login
    // Create class
    // Copy code
    // Student login
    // Join with code
    // Verify enrollment
  });

  it('teacher assigns exam to class', async () => {
    // Create class
    // Add students
    // Create exam
    // Assign to class
    // Verify all students received assignment
  });
});
```

---

## Technical Implementation Details

### Class Code Generation Algorithm

```typescript
// infrastructure/services/ClassCodeGenerator.ts
const CONFUSING_CHARS = ['O', '0', 'I', '1', 'l'];
const VALID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars

export class ClassCodeGenerator {
  private readonly LENGTH = 6;

  generate(): string {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const code = this.generateRandom();
      if (await this.isUnique(code)) {
        return code;
      }
      attempts++;
    }

    throw new Error('Failed to generate unique class code');
  }

  private generateRandom(): string {
    let code = '';
    for (let i = 0; i < this.LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * VALID_CHARS.length);
      code += VALID_CHARS[randomIndex];
    }
    return code;
  }

  private async isUnique(code: string): Promise<boolean> {
    // Check database for existing code
  }
}
```

### Email Service (Invitations)

```typescript
// infrastructure/email/AzureEmailService.ts
export class AzureEmailService implements IEmailService {
  async sendInvitation(invitation: Invitation): Promise<void> {
    const acceptUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${invitation.token}`;

    // Use Azure Communication Services
    await emailClient.send({
      to: invitation.email,
      subject: `Invitation to join ${invitation.className}`,
      html: `
        <h1>You're Invited!</h1>
        <p>Join the class: <strong>${invitation.className}</strong></p>
        <a href="${acceptUrl}">Join Class</a>
        <p>This link expires in 7 days.</p>
      `,
    });
  }
}
```

### CSV Import (BullMQ Worker)

```typescript
// infrastructure/queue/workers/csvImport.worker.ts
export const csvImportWorker = new Worker(
  'csv-import',
  async (job) => {
    const { classId, csvContent, teacherId } = job.data;

    // Parse CSV
    const records = parse(csvContent, { columns: ['email', 'name'] });

    // Validate emails
    const validRecords = records.filter((r) => isValidEmail(r.email));

    // Create invitations
    const invitations = await Promise.all(
      validRecords.map((r) =>
        invitationRepository.create({
          classId,
          teacherId,
          email: r.email,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          token: generateUUID(),
        })
      )
    );

    // Queue emails to send
    for (const invitation of invitations) {
      await emailQueue.add('send-invitation', { invitationId: invitation.id });
    }

    return { imported: invitations.length, failed: records.length - invitations.length };
  },
  { connection: redis }
);
```

---

## Acceptance Criteria

### Iteration 1: Core Class Management (Sprint 1)

- [ ] AC-1.1: Teacher can create a class
- [ ] AC-1.2: System generates unique 6-character class code
- [ ] AC-1.3: Teacher can view all their classes
- [ ] AC-1.4: Teacher can delete a class
- [ ] AC-1.5: Class code doesn't include confusing characters (O, 0, I, 1)

### Iteration 2: Student Join via Code (Sprint 1)

- [ ] AC-2.1: Student can join class with code
- [ ] AC-2.2: System validates code exists
- [ ] AC-2.3: System prevents duplicate enrollment
- [ ] AC-2.4: Student sees "joined" confirmation
- [ ] AC-2.5: Student can view enrolled classes

### Iteration 3: Email Invitations (Sprint 2)

- [ ] AC-3.1: Teacher can invite students by email
- [ ] AC-3.2: System sends email with magic link
- [ ] AC-3.3: Email link accepts invitation (create account or login + join)
- [ ] AC-3.4: System tracks invitation status
- [ ] AC-3.5: Teacher can see pending invitations

### Iteration 4: CSV Import (Sprint 2)

- [ ] AC-4.1: Teacher can upload CSV with students
- [ ] AC-4.2: System validates email format
- [ ] AC-4.3: System removes duplicate emails
- [ ] AC-4.4: System creates invitations for valid emails
- [ ] AC-4.5: Teacher sees import summary

### Iteration 5: Bulk Exam Assignment (Sprint 3)

- [ ] AC-5.1: Teacher can assign exam to entire class
- [ ] AC-5.2: Teacher can exclude specific students
- [ ] AC-5.3: System creates ExamAssignment for each student
- [ ] AC-5.4: Due date applies to all assignments
- [ ] AC-5.5: System skips already assigned students

### Iteration 6: Testing & Polish (Sprint 3)

- [ ] AC-6.1: All unit tests pass (>80% coverage)
- [ ] AC-6.2: All integration tests pass
- [ ] AC-6.3: E2E test for create + join flow passes
- [ ] AC-6.4: E2E test for assign exam to class passes
- [ ] AC-6.5: Documentation updated

---

## Dependencies & Risks

### Dependencies

1. Email service (Azure Communication Services) must be configured
2. Redis (BullMQ) must be running for CSV import worker

### Risks

1. **Email delivery**: Students' email providers may block automated emails
   - Mitigation: Use proper SPF/DKIM records, monitor bounce rates
2. **Class code collisions**: 6-character codes may collide at scale
   - Mitigation: Use 8 characters at 10,000+ classes, or use database sequences
3. **CSV parse errors**: Malformed CSV uploads may fail
   - Mitigation: Clear error messages, show row numbers of errors

---

## Future Enhancements (Out of Scope)

- [ ] Google Classroom sync (import entire class)
- [ ] Microsoft Teams integration
- [ ] Class calendar view
- [ ] Waitlist for full classes
- [ ] Student attendance tracking
- [ ] Class discussion boards
- [ ] Parent/guardian access
- [ ] Multiple teachers per class
- [ ] Class templates
- [ ] Class-level analytics

---

## References

- [ANALISIS_PRODUCTO.md](../ANALISIS_PRODUCTO.md) - Product analysis and competition
- [ADR 0009: Clean Architecture](../adr/0009-clean-architecture.md) - Architecture pattern
- [ADR 0004: Authentication](../adr/0004-authentication-strategy.md) - Auth strategy
- [student-module spec](./student-module.md) - Related student functionality

---

**Spec Version:** 1.0.0
**Last Updated:** February 15, 2026
**Author:** Development Team
**Reviewers:** TBD
**Approval Status:** Pending
