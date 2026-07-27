/**
 * Command Pattern Implementation for Slide Editing
 * Provides undo/redo functionality through command objects
 */

export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  getDescription(): string;
}

/**
 * Base command class with common functionality
 */
abstract class BaseCommand implements Command {
  protected executed: boolean = false;

  abstract execute(): void;
  abstract undo(): void;
  abstract getDescription(): string;

  redo(): void {
    this.execute();
  }

  protected markExecuted() {
    this.executed = true;
  }
}

/**
 * Command to edit text content of an element
 */
export class EditTextCommand extends BaseCommand {
  constructor(
    private element: HTMLElement,
    private oldText: string,
    private newText: string,
  ) {
    super();
  }

  execute(): void {
    if (this.element) {
      this.element.textContent = this.newText;
      this.markExecuted();
    }
  }

  undo(): void {
    if (this.element) {
      this.element.textContent = this.oldText;
    }
  }

  getDescription(): string {
    return `Edit text: "${this.oldText.substring(0, 20)}..." → "${this.newText.substring(0, 20)}..."`;
  }
}

/**
 * Command to edit style properties of an element
 */
export class EditStyleCommand extends BaseCommand {
  private oldStyles: Record<string, string> = {};

  constructor(
    private element: HTMLElement,
    private styleUpdates: Record<string, string>,
  ) {
    super();
    // Store old styles
    Object.keys(styleUpdates).forEach((prop) => {
      const computedStyle = window.getComputedStyle(element);
      this.oldStyles[prop] = computedStyle.getPropertyValue(prop) || "";
    });
  }

  execute(): void {
    if (this.element) {
      Object.entries(this.styleUpdates).forEach(([prop, value]) => {
        this.element.style.setProperty(prop, value);
      });
      this.markExecuted();
    }
  }

  undo(): void {
    if (this.element) {
      Object.entries(this.oldStyles).forEach(([prop, value]) => {
        if (value) {
          this.element.style.setProperty(prop, value);
        } else {
          this.element.style.removeProperty(prop);
        }
      });
    }
  }

  getDescription(): string {
    const props = Object.keys(this.styleUpdates).join(", ");
    return `Edit styles: ${props}`;
  }
}

/**
 * Command to move/reposition an element
 */
export class MoveElementCommand extends BaseCommand {
  constructor(
    private element: HTMLElement,
    private oldPosition: { top: number; left: number },
    private newPosition: { top: number; left: number },
  ) {
    super();
  }

  execute(): void {
    if (this.element) {
      this.element.style.position = "absolute";
      this.element.style.top = `${this.newPosition.top}px`;
      this.element.style.left = `${this.newPosition.left}px`;
      this.markExecuted();
    }
  }

  undo(): void {
    if (this.element) {
      this.element.style.top = `${this.oldPosition.top}px`;
      this.element.style.left = `${this.oldPosition.left}px`;
    }
  }

  getDescription(): string {
    return `Move element: (${this.oldPosition.left}, ${this.oldPosition.top}) → (${this.newPosition.left}, ${this.newPosition.top})`;
  }
}

/**
 * Command to delete an element
 */
export class DeleteElementCommand extends BaseCommand {
  private parent: Node | null = null;
  private nextSibling: Node | null = null;

  constructor(private element: HTMLElement) {
    super();
    this.parent = element.parentNode;
    this.nextSibling = element.nextSibling;
  }

  execute(): void {
    if (this.element && this.parent) {
      this.parent.removeChild(this.element);
      this.markExecuted();
    }
  }

  undo(): void {
    if (this.element && this.parent) {
      if (this.nextSibling) {
        this.parent.insertBefore(this.element, this.nextSibling);
      } else {
        this.parent.appendChild(this.element);
      }
    }
  }

  getDescription(): string {
    return `Delete element: ${this.element.tagName}`;
  }
}

/**
 * Command executor that manages command history
 */
export class CommandExecutor {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  /**
   * Execute a command and add it to history
   */
  execute(command: Command): void {
    // Remove any commands after current index (when undoing and executing new command)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Execute command
    command.execute();

    // Add to history
    this.history.push(command);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Undo last command
   */
  undo(): boolean {
    if (this.canUndo()) {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex -= 1;
      return true;
    }
    return false;
  }

  /**
   * Redo last undone command
   */
  redo(): boolean {
    if (this.canRedo()) {
      this.currentIndex += 1;
      const command = this.history[this.currentIndex];
      command.redo();
      return true;
    }
    return false;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return (
      this.currentIndex < this.history.length - 1 && this.history.length > 0
    );
  }

  /**
   * Clear command history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get command history
   */
  getHistory(): Command[] {
    return this.history.slice(0, this.currentIndex + 1);
  }

  /**
   * Get current command index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }
}
