# Testing Guide for BOM Consolidation Tool

## Overview

This directory contains comprehensive test suites for the BOM Consolidation Tool, covering utilities, hooks, components, and services.

## Test Structure

```
test/
├── README.md                           # This file
├── bomParser.test.js                   # BOM parsing utilities tests
├── lpnUtils.test.js                    # LPN generation utilities tests
├── firebase.test.js                    # Firebase authentication tests
├── firestoreService.test.js           # Firestore service tests
├── useAuth.test.jsx                    # useAuth hook tests
├── useFirestore.test.js               # useFirestore hook tests
├── useGeminiAI.test.js                # Gemini AI integration tests
├── useLPN.test.js                      # LPN management hook tests
├── useToast.test.js                    # Toast notification hook tests
└── components/
    ├── LoadingSpinner.test.jsx        # Loading spinner component tests
    ├── ConfirmModal.test.jsx          # Confirmation modal tests
    └── ToastNotification.test.jsx     # Toast notification tests
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npx vitest run test/bomParser.test.js
```

### Run Tests Matching Pattern
```bash
npx vitest run --grep "LPN"
```

## Test Coverage

### Current Coverage by Module

#### Utilities (100% coverage target)
- ✅ **bomParser.js** - BOM file parsing and flattening
  - CSV parsing with quoted values
  - Excel file parsing
  - Designator column detection
  - Component normalization
  - BOM flattening logic

- ✅ **lpnUtils.js** - Local Part Number generation
  - Sequence formatting
  - MPN hash generation
  - LPN assembly
  - Field locking logic
  - Component validation

#### Hooks (90%+ coverage)
- ✅ **useAuth.js** - Authentication management
  - Sign in/up/out
  - Google authentication
  - Password reset
  - Error handling
  - Auth state subscription

- ✅ **useFirestore.js** - Firestore database operations
  - Component CRUD operations
  - Batch operations
  - Real-time subscriptions
  - Settings management
  - LPN sequence management

- ✅ **useGeminiAI.js** - AI-powered component search
  - Alternative component suggestions
  - API error handling
  - Retry logic
  - Response formatting

- ✅ **useLPN.js** - LPN assignment
  - Single component assignment
  - Batch assignment
  - Validation
  - Field locking

- ✅ **useToast.js** - Toast notifications
  - Toast creation
  - Auto-dismiss
  - Type variations
  - Toast management

#### Components (85%+ coverage)
- ✅ **LoadingSpinner** - Loading state indicator
  - Size variations
  - Message display
  - Fullscreen mode

- ✅ **ConfirmModal** - Confirmation dialogs
  - User interactions
  - Keyboard navigation
  - Type variations (danger/warning/info)

- ✅ **ToastNotification** - Notification display
  - Type styling
  - Positioning
  - Auto-dismiss
  - Progress bar

#### Services (95%+ coverage)
- ✅ **firestoreService.js** - Database operations
  - CRUD operations
  - Query operations
  - Real-time subscriptions
  - Transaction handling

- ✅ **firebase.js** - Firebase configuration
  - Authentication methods
  - User management
  - State subscription

## Test Patterns and Best Practices

### 1. Test Organization
```javascript
describe('ComponentName', () => {
    describe('Feature Group', () => {
        it('should do specific thing', () => {
            // Arrange
            // Act
            // Assert
        });
    });
});
```

### 2. Setup and Teardown
```javascript
beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
});

afterEach(() => {
    // Cleanup
});
```

### 3. Mocking External Dependencies
```javascript
vi.mock('../src/services/firestoreService.js', () => ({
    addComponent: vi.fn(),
    deleteComponent: vi.fn()
}));
```

### 4. Testing Async Operations
```javascript
it('should handle async operation', async () => {
    await act(async () => {
        await result.current.someAsyncFunction();
    });
    
    await waitFor(() => {
        expect(result.current.state).toBe('updated');
    });
});
```

### 5. Testing React Hooks
```javascript
const { result } = renderHook(() => useCustomHook(), {
    wrapper: ({ children }) => {children}
});

act(() => {
    result.current.doSomething();
});

expect(result.current.state).toBe('expected');
```

### 6. Testing User Interactions
```javascript
const user = userEvent.setup();
await user.click(screen.getByText('Click me'));
expect(mockFunction).toHaveBeenCalled();
```

## Writing New Tests

### 1. Create Test File
Name your test file with `.test.js` or `.test.jsx` extension:
```
src/utils/myUtil.js  →  test/myUtil.test.js
src/components/MyComponent.jsx  →  test/components/MyComponent.test.jsx
```

### 2. Import Dependencies
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../src/components/MyComponent';
```

### 3. Write Test Cases
Focus on:
- ✅ Happy path scenarios
- ✅ Edge cases
- ✅ Error handling
- ✅ User interactions
- ✅ State changes
- ✅ Side effects

### 4. Test Coverage Goals
- **Critical Path**: 100% coverage
- **Business Logic**: 95%+ coverage
- **UI Components**: 85%+ coverage
- **Utilities**: 100% coverage

## Common Testing Utilities

### Vitest Matchers
```javascript
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(value).toBeTruthy()
expect(value).toBeDefined()
expect(array).toHaveLength(3)
expect(string).toContain('substring')
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(arg1, arg2)
```

### Testing Library Queries
```javascript
screen.getByText('text')
screen.getByRole('button')
screen.getByLabelText('label')
screen.queryByText('text')  // Returns null if not found
screen.findByText('text')   // Async, waits for element
```

### User Event Simulation
```javascript
const user = userEvent.setup();
await user.click(element);
await user.type(input, 'text');
await user.keyboard('{Enter}');
```

## Debugging Tests

### Run Single Test
```bash
npx vitest run -t "test name"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
    "type": "node",
    "request": "launch",
    "name": "Debug Vitest Tests",
    "runtimeExecutable": "npm",
    "runtimeArgs": ["run", "test"],
    "console": "integratedTerminal"
}
```

### View Coverage Report
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Continuous Integration

Tests are automatically run on:
- ✅ Pull requests
- ✅ Commits to main branch
- ✅ Pre-commit hooks (optional)

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
```javascript
// Solution: Increase timeout
await waitFor(() => {
    expect(element).toBeInTheDocument();
}, { timeout: 10000 });
```

**Issue**: State updates not reflected
```javascript
// Solution: Wrap in act()
await act(async () => {
    await someAsyncFunction();
});
```

**Issue**: Mocks not working
```javascript
// Solution: Clear mocks between tests
beforeEach(() => {
    vi.clearAllMocks();
});
```

**Issue**: Component not rendering
```javascript
// Solution: Check for required providers
render(
    
        
    
);
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:
1. ✅ Write tests first (TDD)
2. ✅ Ensure all tests pass
3. ✅ Maintain coverage above 85%
4. ✅ Follow existing test patterns
5. ✅ Document complex test scenarios

## Test Maintenance

- Review and update tests when refactoring
- Remove obsolete tests
- Keep test data realistic
- Avoid testing implementation details
- Focus on behavior, not structure