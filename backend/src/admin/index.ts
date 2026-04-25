import AdminJS from 'adminjs';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { container } from '@config/container.js';

// Reuse the PrismaClient from the container to avoid duplicate connections
const prisma = container.prisma;
AdminJS.registerAdapter({ Database, Resource });

export const admin = new AdminJS({
  resources: [
    // User Management
    {
      resource: { model: getModelByName('User'), client: prisma },
      options: {
        id: 'User',
        navigation: {
          name: 'User Management',
          icon: 'User',
        },
        listProperties: ['email', 'firstName', 'lastName', 'role', 'provider', 'createdAt'],
        editProperties: ['email', 'firstName', 'lastName', 'role', 'provider', 'providerId'],
        filterProperties: ['email', 'firstName', 'lastName', 'role', 'provider', 'provider'],
        showProperties: [
          'id',
          'email',
          'firstName',
          'lastName',
          'role',
          'provider',
          'providerId',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          password: {
            isVisible: false,
          },
          providerId: {
            isVisible: {
              list: false,
              filter: false,
              show: true,
              edit: true,
            },
          },
        },
      },
    },
    {
      resource: { model: getModelByName('UserPreferences'), client: prisma },
      options: {
        id: 'UserPreferences',
        parent: 'User',
        navigation: {
          name: 'User Management',
          icon: 'User',
        },
      },
    },

    // Class Management
    {
      resource: { model: getModelByName('Class'), client: prisma },
      options: {
        id: 'Class',
        navigation: {
          name: 'Class Management',
          icon: 'Users',
        },
        listProperties: ['name', 'code', 'color', 'teacher', 'createdAt'],
        filterProperties: ['name', 'code', 'color'],
        properties: {
          teacher: {
            reference: 'User',
          },
        },
      },
    },
    {
      resource: { model: getModelByName('StudentEnrollment'), client: prisma },
      options: {
        id: 'StudentEnrollment',
        parent: 'Class',
        navigation: {
          name: 'Class Management',
          icon: 'Users',
        },
        showProperties: ['id', 'student', 'class', 'joinedAt', 'leftAt', 'isActive'],
        properties: {
          student: { reference: 'User' },
          class: { reference: 'Class' },
        },
      },
    },
    {
      resource: { model: getModelByName('Invitation'), client: prisma },
      options: {
        id: 'Invitation',
        parent: 'Class',
        navigation: {
          name: 'Class Management',
          icon: 'Users',
        },
        listProperties: ['email', 'class', 'status', 'expiresAt', 'createdAt'],
        filterProperties: ['email', 'status'],
        properties: {
          class: { reference: 'Class' },
          teacher: { reference: 'User' },
        },
      },
    },

    // Exam Management
    {
      resource: { model: getModelByName('Exam'), client: prisma },
      options: {
        id: 'Exam',
        navigation: {
          name: 'Exam Management',
          icon: 'Clipboard',
        },
        listProperties: ['title', 'user', 'questionCount', 'createdAt'],
        filterProperties: ['title', 'user'],
        properties: {
          user: { reference: 'User' },
          questions: { reference: 'Question' },
        },
      },
    },
    {
      resource: { model: getModelByName('Question'), client: prisma },
      options: {
        id: 'Question',
        parent: 'Exam',
        navigation: {
          name: 'Exam Management',
          icon: 'Clipboard',
        },
        listProperties: ['type', 'difficulty', 'questionText', 'orderIndex'],
        filterProperties: ['type', 'difficulty'],
        editProperties: [
          'type',
          'difficulty',
          'questionText',
          'options',
          'correctAnswer',
          'explanation',
          'points',
          'orderIndex',
        ],
        properties: {
          exam: { reference: 'Exam' },
          questionText: {
            type: 'textarea',
          },
          options: {
            isArray: true,
            description: 'Enter options as JSON array: ["Option A", "Option B", "Option C"]',
          },
          correctAnswer: {
            type: 'textarea',
            description: 'The correct answer (should match one of the options)',
          },
          explanation: {
            type: 'textarea',
          },
        },
      },
    },
    {
      resource: { model: getModelByName('ClassExam'), client: prisma },
      options: {
        id: 'ClassExam',
        navigation: {
          name: 'Exam Management',
          icon: 'Clipboard',
        },
        listProperties: ['exam', 'class', 'isPublished', 'availableAt', 'dueDate'],
        filterProperties: ['isPublished', 'availableAt', 'dueDate'],
        properties: {
          exam: { reference: 'Exam' },
          class: { reference: 'Class' },
          teacher: { reference: 'User' },
        },
      },
    },
    {
      resource: { model: getModelByName('ExamAssignment'), client: prisma },
      options: {
        id: 'ExamAssignment',
        parent: 'ClassExam',
        navigation: {
          name: 'Exam Management',
          icon: 'Clipboard',
        },
        listProperties: ['student', 'exam', 'status', 'score', 'submittedAt'],
        filterProperties: ['status', 'score'],
        properties: {
          exam: { reference: 'Exam' },
          student: { reference: 'User' },
          teacher: { reference: 'User' },
          classExam: { reference: 'ClassExam' },
        },
      },
    },
    {
      resource: { model: getModelByName('StudentAnswer'), client: prisma },
      options: {
        id: 'StudentAnswer',
        parent: 'ExamAssignment',
        navigation: {
          name: 'Exam Management',
          icon: 'Clipboard',
        },
        showProperties: ['id', 'assignment', 'question', 'answerText', 'isCorrect', 'createdAt'],
        properties: {
          assignment: { reference: 'ExamAssignment' },
          question: { reference: 'Question' },
        },
      },
    },

    // Document Management
    {
      resource: { model: getModelByName('Document'), client: prisma },
      options: {
        id: 'Document',
        navigation: {
          name: 'Document Management',
          icon: 'FileText',
        },
        listProperties: ['title', 'filename', 'status', 'fileSize', 'uploadedAt', 'user'],
        filterProperties: ['title', 'status', 'user'],
        properties: {
          user: { reference: 'User' },
        },
      },
    },
    {
      resource: { model: getModelByName('DocumentChunk'), client: prisma },
      options: {
        id: 'DocumentChunk',
        parent: 'Document',
        navigation: {
          name: 'Document Management',
          icon: 'FileText',
        },
        listProperties: ['document', 'chunkIndex', 'wordCount', 'pageNumber'],
        filterProperties: ['chunkIndex', 'pageNumber'],
        showProperties: ['id', 'document', 'content', 'chunkIndex', 'wordCount', 'pageNumber'],
        properties: {
          document: { reference: 'Document' },
          content: { type: 'textarea' },
        },
      },
    },
    {
      resource: { model: getModelByName('ClassDocument'), client: prisma },
      options: {
        id: 'ClassDocument',
        navigation: {
          name: 'Document Management',
          icon: 'FileText',
        },
        listProperties: ['class', 'document', 'isVisible', 'orderIndex', 'publishedAt'],
        filterProperties: ['isVisible', 'publishedAt'],
        properties: {
          class: { reference: 'Class' },
          document: { reference: 'Document' },
        },
      },
    },
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'Exam Generator',
    logo: '',
    favicon: '',
  },
});

export default admin;
