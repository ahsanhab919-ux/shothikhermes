// Type definitions for better type safety
type FormDataValue = string | number | boolean | File | Blob;
type FormDataObject = {
  [key: string]:
    | FormDataValue
    | FormDataValue[]
    | Record<string, any>
    | null
    | undefined;
};

interface FormDataConverterOptions {
  arrayNotation?: boolean; // Use [] notation for arrays (default: true)
  dateFormat?: "iso" | "timestamp"; // How to format Date objects (default: 'iso')
  skipNulls?: boolean; // Skip null values (default: true)
  skipUndefined?: boolean; // Skip undefined values (default: true)
}

/**
 * ObjectToFormData Converter Class
 * Converts JavaScript objects to FormData with proper type handling
 */
export class ObjectToFormDataConverter {
  private options: Required<FormDataConverterOptions>;
  private formData: FormData;

  constructor(options: FormDataConverterOptions = {}) {
    this.options = {
      arrayNotation: options.arrayNotation ?? true,
      dateFormat: options.dateFormat ?? "iso",
      skipNulls: options.skipNulls ?? true,
      skipUndefined: options.skipUndefined ?? true,
    };
    this.formData = new FormData();
  }

  /**
   * Convert object to FormData
   */
  public convert(obj: FormDataObject): FormData {
    this.formData = new FormData();
    this.processObject(obj);
    return this.formData;
  }

  /**
   * Process the main object
   */
  private processObject(obj: FormDataObject): void {
    Object.entries(obj).forEach(([key, value]) => {
      this.appendValue(key, value);
    });
  }

  /**
   * Append value to FormData with proper handling
   */
  private appendValue(key: string, value: unknown, parentKey?: string): void {
    const fieldName = this.buildFieldName(key, parentKey);

    if (this.shouldSkipValue(value)) {
      return;
    }

    if (this.isNull(value)) {
      this.handleNullValue(fieldName);
      return;
    }

    if (this.isUndefined(value)) {
      this.handleUndefinedValue(fieldName);
      return;
    }

    if (this.isArray(value)) {
      this.handleArray(fieldName, value);
      return;
    }

    if (this.isFileOrBlob(value)) {
      this.handleFileOrBlob(fieldName, value);
      return;
    }

    if (this.isDate(value)) {
      this.handleDate(fieldName, value);
      return;
    }

    if (this.isPlainObject(value)) {
      this.handlePlainObject(fieldName, value);
      return;
    }

    this.handlePrimitiveValue(fieldName, value);
  }

  /**
   * Build field name with proper nesting
   */
  private buildFieldName(key: string, parentKey?: string): string {
    return parentKey ? `${parentKey}[${key}]` : key;
  }

  /**
   * Check if value should be skipped
   */
  private shouldSkipValue(value: unknown): boolean {
    return (
      (this.options.skipNulls && this.isNull(value)) ||
      (this.options.skipUndefined && this.isUndefined(value))
    );
  }

  /**
   * Type checking methods
   */
  private isNull(value: unknown): value is null {
    return value === null;
  }

  private isUndefined(value: unknown): value is undefined {
    return value === undefined;
  }

  private isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  private isFileOrBlob(value: unknown): value is File | Blob {
    return value instanceof File || value instanceof Blob;
  }

  private isDate(value: unknown): value is Date {
    return value instanceof Date;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === "object" &&
      value !== null &&
      value.constructor === Object
    );
  }

  /**
   * Value handling methods
   */
  private handleNullValue(fieldName: string): void {
    if (!this.options.skipNulls) {
      this.formData.append(fieldName, "");
    }
  }

  private handleUndefinedValue(fieldName: string): void {
    if (!this.options.skipUndefined) {
      this.formData.append(fieldName, "");
    }
  }

  private handleArray(fieldName: string, value: unknown[]): void {
    if (value.length === 0) {
      this.formData.append(
        this.options.arrayNotation ? `${fieldName}[]` : fieldName,
        "",
      );
      return;
    }

    value.forEach((item, index) => {
      const arrayKey = this.options.arrayNotation
        ? `${fieldName}[]`
        : `${fieldName}[${index}]`;

      this.handleArrayItem(arrayKey, item);
    });
  }

  private handleArrayItem(arrayKey: string, item: unknown): void {
    if (this.isNull(item) || this.isUndefined(item)) {
      if (
        (!this.options.skipNulls && this.isNull(item)) ||
        (!this.options.skipUndefined && this.isUndefined(item))
      ) {
        this.formData.append(arrayKey, "");
      }
    } else if (this.isPlainObject(item)) {
      this.formData.append(arrayKey, this.stringifyValue(item));
    } else {
      this.formData.append(arrayKey, this.convertToString(item));
    }
  }

  private handleFileOrBlob(fieldName: string, value: File | Blob): void {
    this.formData.append(fieldName, value);
  }

  private handleDate(fieldName: string, value: Date): void {
    const dateValue = this.formatDate(value);
    this.formData.append(fieldName, dateValue);
  }

  private handlePlainObject(
    fieldName: string,
    value: Record<string, unknown>,
  ): void {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      this.appendValue(nestedKey, nestedValue, fieldName);
    });
  }

  private handlePrimitiveValue(fieldName: string, value: unknown): void {
    this.formData.append(fieldName, this.convertToString(value));
  }

  /**
   * Utility methods
   */
  private formatDate(date: Date): string {
    return this.options.dateFormat === "timestamp"
      ? date.getTime().toString()
      : date.toISOString();
  }

  private convertToString(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (this.isDate(value)) {
      return this.formatDate(value);
    }

    if (typeof value === "object") {
      return this.stringifyValue(value);
    }

    return String(value);
  }

  private stringifyValue(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  /**
   * Get current options
   */
  public getOptions(): Required<FormDataConverterOptions> {
    return { ...this.options };
  }

  /**
   * Update options
   */
  public setOptions(newOptions: Partial<FormDataConverterOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

/**
 * FormData to Object Converter Class
 */
export class FormDataToObjectConverter {
  /**
   * Convert FormData back to object for debugging
   */
  public static convert(formData: FormData): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (result[key]) {
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}

/**
 * Factory class for creating converters
 */
export class FormDataConverterFactory {
  /**
   * Create ObjectToFormData converter with default options
   */
  public static createObjectToFormData(
    options?: FormDataConverterOptions,
  ): ObjectToFormDataConverter {
    return new ObjectToFormDataConverter(options);
  }

  /**
   * Create FormDataToObject converter
   */
  public static createFormDataToObject(): typeof FormDataToObjectConverter {
    return FormDataToObjectConverter;
  }

  /**
   * Quick convert method for simple use cases
   */
  public static quickConvert(
    obj: FormDataObject,
    options?: FormDataConverterOptions,
  ): FormData {
    const converter = new ObjectToFormDataConverter(options);
    return converter.convert(obj);
  }
}
