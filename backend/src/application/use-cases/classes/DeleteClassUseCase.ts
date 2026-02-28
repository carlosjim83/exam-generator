import type { ClassDeletedEvent } from '@domain/events/DocumentEvents.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { eventBus } from '@infrastructure/events/EventBus.js';

export class DeleteClassCommand {
  constructor(
    public classId: string,
    public teacherId: string
  ) {}
}

export class DeleteClassUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(command: DeleteClassCommand): Promise<void> {
    const classId = new ClassId(command.classId);
    const teacherId = command.teacherId;

    // First verify the class exists and belongs to the teacher
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new Error('Class not found');
    }

    if (classEntity.teacherId.toString() !== teacherId) {
      throw new Error('You do not have permission to delete this class');
    }

    // Store metadata before deletion for the event
    const classMetadata = {
      classId: classEntity.id.value,
      teacherId: classEntity.teacherId.value,
      className: classEntity.name,
    };

    // Delete the class
    await this.classRepository.delete(classId);

    // Emit domain event for cleanup of related entities
    const event: ClassDeletedEvent = {
      eventName: 'class.deleted',
      aggregateId: classMetadata.classId,
      occurredAt: new Date(),
      payload: classMetadata,
    };
    eventBus.publish(event);
  }
}
