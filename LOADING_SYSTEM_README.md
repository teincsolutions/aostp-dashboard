# Loading System Documentation

This document explains how to use the loading splash system that has been integrated into the AOSTP Dashboard.

## Overview

The loading system provides a beautiful, full-screen loading splash using Ant Design's Spin component with a backdrop blur effect. It's automatically integrated into the root layout and works during:

1. **Page Navigation**: Automatically shows loading when navigating between pages
2. **Async Operations**: Can be manually triggered for API calls, data fetching, etc.
3. **Manual Control**: Can be shown/hidden programmatically as needed

## Components

### LoadingSplash
A full-screen loading component with:
- Ant Design Spin indicator
- Customizable message
- Backdrop blur effect
- High z-index to appear above all content

### LoadingProvider & LoadingContext
Context provider that manages the global loading state throughout the application.

### NavigationWrapper
Handles automatic loading during page transitions using Next.js router events.

### usePageLoading Hook
Convenient hook for controlling loading states in components.

## Usage

### Basic Navigation Loading

The loading splash automatically appears during page navigation. No additional code is needed for basic navigation.

```tsx
import { useRouter } from 'next/navigation';

function MyComponent() {
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/dashboard'); // Loading splash will automatically appear
  };

  return (
    <Button onClick={handleNavigation}>
      Go to Dashboard
    </Button>
  );
}
```

### Async Operations with Loading

```tsx
import { usePageLoading } from '@/hooks/usePageLoading';

function MyComponent() {
  const { withLoading } = usePageLoading();

  const handleAsyncOperation = async () => {
    const result = await withLoading(async () => {
      // Your async operation here
      const data = await apiCall();
      return data;
    }, 'Fetching data...');

    console.log(result);
  };

  return (
    <Button onClick={handleAsyncOperation}>
      Load Data
    </Button>
  );
}
```

### Manual Loading Control

```tsx
import { usePageLoading } from '@/hooks/usePageLoading';

function MyComponent() {
  const { showLoading, hideLoading } = usePageLoading();

  const handleCustomLoading = () => {
    showLoading('Custom loading message...');

    // Perform your operation
    setTimeout(() => {
      hideLoading();
    }, 2000);
  };

  return (
    <Button onClick={handleCustomLoading}>
      Show Loading
    </Button>
  );
}
```

### Enhanced Navigation with Custom Messages

```tsx
import { usePageLoading } from '@/hooks/usePageLoading';

function MyComponent() {
  const { navigateWithLoading } = usePageLoading();

  const handleNavigation = () => {
    navigateWithLoading('/users', 'Loading users...');
  };

  return (
    <Button onClick={handleNavigation}>
      Go to Users
    </Button>
  );
}
```

## API Reference

### usePageLoading Hook

```tsx
const {
  isLoading,           // boolean - current loading state
  navigateWithLoading, // (url: string, message?: string) => void
  replaceWithLoading,  // (url: string, message?: string) => void
  withLoading,         // <T>(asyncFn: () => Promise<T>, message?: string) => Promise<T>
  showLoading,         // (message?: string) => void
  hideLoading,         // () => void
} = usePageLoading();
```

### LoadingSplash Props

```tsx
interface LoadingSplashProps {
  message?: string;    // Loading message to display
  size?: 'small' | 'default' | 'large'; // Spin size
}
```

## Integration Details

The loading system is automatically integrated into the root layout (`src/app/layout.tsx`) and will work across the entire application without requiring any additional setup in individual components for basic navigation.

## Customization

### Styling
The loading splash uses inline styles for maximum compatibility. To customize the appearance, modify the `LoadingSplash` component.

### Messages
Default messages can be customized by passing different message strings to the various methods.

## Best Practices

1. **Use descriptive messages**: Provide clear, user-friendly loading messages
2. **Handle errors**: Always wrap async operations in try-catch blocks
3. **Avoid nested loading**: Don't show multiple loading states simultaneously
4. **Keep operations short**: Long operations should provide progress feedback

## Example Integration

See `src/components/LoadingExample.tsx` for a complete example of how to use all the loading features.
