# Classes & Invitations Frontend Feature

## Feature Overview

This feature implements the Classes & Invitations functionality for the exam generator application, allowing teachers to create classes with unique codes and students to join via code or email invitations.

## Implementation Status

### Backend (Complete ✅)

- All API endpoints implemented
- 14 complete use cases
- 411 tests passing

### Frontend (In Progress 🚧)

Creating Next.js components following the existing patterns in the codebase.

## Architecture

Following the existing architecture:

- **App Router**: `/dashboard/classes` and `/student/join`
- **Component Library**: `/features/classes/components/`
- **State Management**: Server components with props
- **API Integration**: Using fetch to backend endpoints

## Components

### Teacher Dashboard

- **ClassCard**: Display class information with code and student count
- **ClassList**: Paginated list of classes
- **ClassDetails**: Full class details with student list
- **CreateClassForm**: Form to create new class
- **InviteStudentsDialog**: Dialog to invite students by email

### Student Portal

- **JoinClassForm**: Form to join class by code
- **InvitationAcceptForm**: Accept invitation by token
- **ClassDashboard**: View enrolled classes and assignments

## API Endpoints Reference

### Classes

- `POST /api/classes` - Create class
- `GET /api/classes` - List classes
- `GET /api/classes/:id` - Get class details
- `GET /api/classes/code/:code` - Get class by code
- `DELETE /api/classes/:id` - Delete class

### Students

- `GET /api/classes/:classId/students` - List students
- `POST /api/classes/:classId/join` - Join class

### Invitations

- `POST /api/classes/:classId/invitations` - Invite students
- `POST /api/classes/:classId/invitations/csv` - Import CSV
- `GET /api/classes/:classId/invitations` - List invitations
- `POST /invitations/:token/accept` - Accept invitation
- `POST /invitations/:token/resend` - Resend invitation

## Design Patterns

- **Container/Presenter Pattern**: Separate container classes from presentational components
- **Atomic Design**: Molecule/Atom components for reusability
- **Formik/Yup**: Form validation
- **Zod**: Schema validation for API responses

## Testing

- Component tests using Vitest
- E2E tests using Playwright
- Mock API responses for isolated testing

## Dependencies

- React 18
- Next.js 14 (App Router)
- TailwindCSS
- shadcn/ui components
- Lucide icons

## Status

- [ ] Setup project structure
- [ ] Create core components (ClassCard, ClassList)
- [ ] Create forms (CreateClassForm, JoinClassForm)
- [ ] Implement Dialog components for invitations
- [ ] Add API client functions
- [ ] Create page components
- [ ] Write tests
- [ ] Documentation

## Notes

- Follow existing code patterns in `/frontend/features/`
- Use TypeScript strictly
- Follow shadcn/ui component conventions
- Write tests before implementation (TDD)
