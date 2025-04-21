// Type definitions for @testing-library/jest-dom
import '@testing-library/jest-dom';

declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toHaveClass(className: string): void;
      toBeVisible(): void;
      toHaveTextContent(text: string): void;
      toHaveAttribute(attr: string, value?: string): void;
      toBeDisabled(): void;
      toBeEnabled(): void;
      toBeChecked(): void;
      toBeEmpty(): void;
      toBeEmptyDOMElement(): void;
      toBeInvalid(): void;
      toBeRequired(): void;
      toBeValid(): void;
      toContainElement(element: HTMLElement | null): void;
      toContainHTML(htmlText: string): void;
      toHaveFocus(): void;
      toHaveFormValues(expectedValues: Record<string, any>): void;
      toHaveStyle(css: string | Record<string, any>): void;
      toHaveValue(value: string | string[] | number): void;
      toBePartiallyChecked(): void;
    }
  }
}
