/**
 * @file LoadingSpinner.test.jsx
 * @description Test suite for LoadingSpinner component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../src/components/LoadingSpinner.jsx';

describe('LoadingSpinner Component', () => {
    describe('Rendering', () => {
        it('should render without crashing', () => {
            render(<LoadingSpinner />);
            expect(document.querySelector('.animate-spin')).toBeInTheDocument();
        });

        it('should render with default size (md)', () => {
            const { container } = render(<LoadingSpinner />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toHaveClass('w-8', 'h-8', 'border-2');
        });

        it('should render with small size', () => {
            const { container } = render(<LoadingSpinner size="sm" />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toHaveClass('w-4', 'h-4', 'border-2');
        });

        it('should render with large size', () => {
            const { container } = render(<LoadingSpinner size="lg" />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toHaveClass('w-12', 'h-12', 'border-3');
        });

        it('should render with extra large size', () => {
            const { container } = render(<LoadingSpinner size="xl" />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toHaveClass('w-16', 'h-16', 'border-4');
        });

        it('should render without message by default', () => {
            render(<LoadingSpinner />);
            expect(screen.queryByText(/./)).not.toBeInTheDocument();
        });

        it('should render with message when provided', () => {
            render(<LoadingSpinner message="Loading data..." />);
            expect(screen.getByText('Loading data...')).toBeInTheDocument();
        });

        it('should render in normal mode by default', () => {
            const { container } = render(<LoadingSpinner />);
            expect(container.firstChild).not.toHaveClass('fixed', 'inset-0');
        });

        it('should render in fullscreen mode when enabled', () => {
            const { container } = render(<LoadingSpinner fullScreen={true} />);
            const wrapper = container.querySelector('.fixed.inset-0');
            expect(wrapper).toBeInTheDocument();
            expect(wrapper).toHaveClass('bg-black/75', 'backdrop-blur-sm', 'z-50');
        });
    });

    describe('Size Variations', () => {
        it('should handle invalid size gracefully', () => {
            const { container } = render(<LoadingSpinner size="invalid" />);
            const spinner = container.querySelector('.animate-spin');
            // Should default to md
            expect(spinner).toHaveClass('w-8', 'h-8');
        });

        it('should apply correct classes for all valid sizes', () => {
            const sizes = {
                sm: ['w-4', 'h-4', 'border-2'],
                md: ['w-8', 'h-8', 'border-2'],
                lg: ['w-12', 'h-12', 'border-3'],
                xl: ['w-16', 'h-16', 'border-4']
            };

            Object.entries(sizes).forEach(([size, classes]) => {
                const { container } = render(<LoadingSpinner size={size} />);
                const spinner = container.querySelector('.animate-spin');
                classes.forEach(cls => {
                    expect(spinner).toHaveClass(cls);
                });
            });
        });
    });

    describe('Message Display', () => {
        it('should display short message', () => {
            render(<LoadingSpinner message="Loading" />);
            expect(screen.getByText('Loading')).toBeInTheDocument();
        });

        it('should display long message', () => {
            const longMessage = 'This is a very long loading message that should still be displayed correctly';
            render(<LoadingSpinner message={longMessage} />);
            expect(screen.getByText(longMessage)).toBeInTheDocument();
        });

        it('should style message correctly', () => {
            render(<LoadingSpinner message="Test message" />);
            const message = screen.getByText('Test message');
            expect(message).toHaveClass('text-gray-400', 'text-sm');
        });

        it('should position message below spinner', () => {
            const { container } = render(<LoadingSpinner message="Loading..." />);
            const wrapper = container.querySelector('.flex-col');
            expect(wrapper).toHaveClass('gap-4');
        });
    });

    describe('Fullscreen Mode', () => {
        it('should apply fullscreen overlay styles', () => {
            const { container } = render(<LoadingSpinner fullScreen={true} message="Loading..." />);
            const overlay = container.querySelector('.fixed.inset-0');
            expect(overlay).toHaveClass('bg-black/75', 'backdrop-blur-sm');
        });

        it('should center content in fullscreen mode', () => {
            const { container } = render(<LoadingSpinner fullScreen={true} />);
            const overlay = container.querySelector('.fixed');
            expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
        });

        it('should have high z-index in fullscreen mode', () => {
            const { container } = render(<LoadingSpinner fullScreen={true} />);
            const overlay = container.querySelector('.fixed');
            expect(overlay).toHaveClass('z-50');
        });
    });

    describe('Styling', () => {
        it('should apply keylife-accent color to spinner', () => {
            const { container } = render(<LoadingSpinner />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toHaveClass('border-t-keylife-accent');
        });

        it('should have gray border for base', () => {
            const { container } = render(<LoadingSpinner />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toHaveClass('border-gray-700');
        });

        it('should be circular', () => {
            const { container } = render(<LoadingSpinner />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toHaveClass('rounded-full');
        });

        it('should have spin animation', () => {
            const { container } = render(<LoadingSpinner />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toHaveClass('animate-spin');
        });
    });

    describe('Combined Props', () => {
        it('should handle all props together', () => {
            const { container } = render(
                <LoadingSpinner 
                    size="lg" 
                    message="Processing your request..." 
                    fullScreen={true} 
                />
            );
            
            expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
            expect(container.querySelector('.w-12.h-12')).toBeInTheDocument();
            expect(screen.getByText('Processing your request...')).toBeInTheDocument();
        });

        it('should work with size and message only', () => {
            render(<LoadingSpinner size="sm" message="Loading..." />);
            
            expect(screen.getByText('Loading...')).toBeInTheDocument();
            const spinner = document.querySelector('.w-4.h-4');
            expect(spinner).toBeInTheDocument();
        });

        it('should work with fullscreen and message only', () => {
            const { container } = render(
                <LoadingSpinner fullScreen={true} message="Please wait..." />
            );
            
            expect(container.querySelector('.fixed')).toBeInTheDocument();
            expect(screen.getByText('Please wait...')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string message', () => {
            const { container } = render(<LoadingSpinner message="" />);
            // Should render spinner but no message paragraph
            const spinner = container.querySelector('.animate-spin');
            const messageParagraph = container.querySelector('p');
            expect(spinner).toBeInTheDocument();
            expect(messageParagraph).not.toBeInTheDocument();
        });

        it('should handle null message', () => {
            render(<LoadingSpinner message={null} />);
            expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
        });

        it('should handle undefined props', () => {
            render(<LoadingSpinner size={undefined} message={undefined} fullScreen={undefined} />);
            // Should render with defaults
            expect(document.querySelector('.animate-spin')).toBeInTheDocument();
        });

        it('should handle boolean false for fullScreen', () => {
            const { container } = render(<LoadingSpinner fullScreen={false} />);
            expect(container.querySelector('.fixed')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should be perceivable by screen readers', () => {
            const { container } = render(<LoadingSpinner message="Loading..." />);
            const spinnerWrapper = container.firstChild;
            expect(spinnerWrapper).toBeInTheDocument();
        });

        it('should display message text accessibly', () => {
            render(<LoadingSpinner message="Loading your data" />);
            const message = screen.getByText('Loading your data');
            expect(message).toBeVisible();
        });
    });

    describe('Snapshot Testing', () => {
        it('should match snapshot with default props', () => {
            const { container } = render(<LoadingSpinner />);
            expect(container).toMatchSnapshot();
        });

        it('should match snapshot with all props', () => {
            const { container } = render(
                <LoadingSpinner 
                    size="lg" 
                    message="Loading..." 
                    fullScreen={true} 
                />
            );
            expect(container).toMatchSnapshot();
        });
    });
});