import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button element by default', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /Click me/i });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render children text', () => {
      render(<Button>Submit</Button>);

      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      render(<Button variant="default">Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
    });

    it('should render with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-destructive-foreground');
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-input');
      expect(button).toHaveClass('bg-background');
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('text-secondary-foreground');
    });

    it('should render with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
      expect(button).toHaveClass('hover:text-accent-foreground');
    });

    it('should render with link variant', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('underline-offset-4');
    });

    it('should use default variant when no variant specified', () => {
      render(<Button>No Variant</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });
  });

  describe('Sizes', () => {
    it('should render with default size', () => {
      render(<Button size="default">Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
    });

    it('should render with sm size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
    });

    it('should render with lg size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-8');
    });

    it('should render with icon size', () => {
      render(<Button size="icon">I</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('w-9');
    });

    it('should use default size when no size specified', () => {
      render(<Button>No Size</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
    });
  });

  describe('States', () => {
    it('should render disabled state', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick multiple times', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should pass event to onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('asChild Prop', () => {
    it('should render as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /Link Button/i });
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/test');
    });

    it('should apply button classes to child when asChild', () => {
      render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-destructive');
      expect(link).toHaveClass('text-destructive-foreground');
    });

    it('should render as button when asChild is false', () => {
      render(<Button asChild={false}>Normal Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Combination of Props', () => {
    it('should combine variant and size', () => {
      render(
        <Button variant="outline" size="lg">
          Large Outline
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-input');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-8');
    });

    it('should combine variant, size, and disabled', () => {
      render(
        <Button variant="secondary" size="sm" disabled>
          Small Secondary Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('h-8');
      expect(button).toBeDisabled();
    });

    it('should combine variant, size, and custom className', () => {
      render(
        <Button variant="ghost" size="icon" className="my-custom-class">
          G
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('w-9');
      expect(button).toHaveClass('my-custom-class');
    });
  });

  describe('HTML Attributes', () => {
    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      const button = screen.getByRole('button', { name: /Close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('should support data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);

      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
    });

    it('should support id attribute', () => {
      render(<Button id="my-button">Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'my-button');
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<Button>Accessible Button</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have focus ring styles', () => {
      render(<Button>Focus Me</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-1');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Press Enter</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('should be accessible via Space key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Press Space</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalled();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).not.toHaveFocus();
    });
  });

  describe('Base Styles', () => {
    it('should have base button styles', () => {
      render(<Button>Styled Button</Button>);

      const button = screen.getByRole('button');

      // Base styles from buttonVariants
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
      expect(button).toHaveClass('rounded-md');
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('font-medium');
    });

    it('should have transition styles', () => {
      render(<Button>Animated</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
    });
  });

  describe('Children Content', () => {
    it('should render text children', () => {
      render(<Button>Text Content</Button>);

      expect(screen.getByText('Text Content')).toBeInTheDocument();
    });

    it('should render icon children', () => {
      render(
        <Button>
          <svg data-testid="icon" />
          With Icon
        </Button>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <Button>
          <span>Before</span>
          <strong>Middle</strong>
          <span>After</span>
        </Button>
      );

      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('should handle undefined variant', () => {
      render(<Button variant={undefined}>Undefined Variant</Button>);

      const button = screen.getByRole('button');
      // Should fall back to default variant
      expect(button).toHaveClass('bg-primary');
    });

    it('should handle undefined size', () => {
      render(<Button size={undefined}>Undefined Size</Button>);

      const button = screen.getByRole('button');
      // Should fall back to default size
      expect(button).toHaveClass('h-9');
    });

    it('should handle null className', () => {
      render(<Button className={undefined}>No Custom Class</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
