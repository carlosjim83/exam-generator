import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class Class {
  readonly id: ClassId;
  readonly teacherId: UserId;
  private _name: string;
  private _description: string | null;
  private _code: string;
  private _color: string | null;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: ClassId,
    teacherId: UserId,
    name: string,
    code: string,
    description: string | null = null,
    color: string | null = null,
    createdAt: Date = new Date()
  ) {
    this.id = id;
    this.teacherId = teacherId;
    this._name = name;
    this._code = code;
    this._description = description;
    this._color = color;
    this.createdAt = createdAt;
    this._updatedAt = createdAt;

    this.validate();
  }

  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Class name cannot be empty');
    }

    if (this._name.length > 255) {
      throw new Error('Class name cannot exceed 255 characters');
    }

    if (!this._code || this._code.length < 6 || this._code.length > 8) {
      throw new Error('Class code must be 6-8 characters');
    }

    if (this._color && !this._isValidColor(this._color)) {
      throw new Error('Invalid color format. Use #RRGGBB');
    }

    if (this._description && this._description.length > 5000) {
      throw new Error('Description cannot exceed 5000 characters');
    }
  }

  private _isValidColor(color: string): boolean {
    return /^#([0-9A-Fa-f]{6})$/.test(color);
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get code(): string {
    return this._code;
  }

  get color(): string | null {
    return this._color;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  equals(other: Class): boolean {
    return this.id.equals(other.id);
  }
}
