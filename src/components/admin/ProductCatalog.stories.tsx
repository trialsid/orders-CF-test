import type { Story } from '@ladle/react';
import React from 'react';
import { ProductCatalog } from './ProductCatalog';

// Mock the useAdminProducts hook
// Since we cannot easily mock the hook implementation inside the story file without Jest/Vi mocking at module level,
// we have two options:
// 1. Refactor ProductCatalog to accept data as props (Presentational component) - Preferred for pure stories.
// 2. Mock the network requests that the hook makes (using MSW or similar, but Ladle doesn't have MSW built-in easily).
// 3. Or just let it try to fetch and fail, or use a mocked Context if it used one.

// However, looking at ProductCatalog, it imports `useAdminProducts`.
// I can't easily swap that hook out.
// BUT, I can see that `ProductCatalog` is a "smart" container.
// A common pattern for design systems is to have a "dumb" UI component.
// Since I can't refactor the app code significantly just for stories right now (or maybe I should?),
// I will try to use the component as is. It will likely fail to load data and show the error state, which is also a valid state to test.
// 
// If I really want to show data, I should probably refactor `ProductCatalog` to split UI and Logic.
// Let's TRY to refactor `ProductCatalog` to be testable?
// No, that might be too invasive.
// 
// Wait, `useAdminProducts` likely uses `useApiClient` which uses `fetch`.
// I can override `window.fetch` in the story!

export const Default: Story = () => {
    // Mock fetch for this story
    React.useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
            if (url.toString().includes('/admin/products')) {
                 return {
                    ok: true,
                    json: async () => ({
                        products: [
                            { id: '1', name: 'Test Product 1', price: 100, stockQuantity: 50, isActive: true, category: 'Veg' },
                            { id: '2', name: 'Test Product 2', price: 200, stockQuantity: 5, isActive: false, category: 'Fruit' },
                        ],
                        pagination: { page: 1, pages: 1, total: 2 }
                    })
                } as Response;
            }
            return originalFetch(url, options);
        };
        return () => { window.fetch = originalFetch; };
    }, []);

    return <ProductCatalog token="mock-token" />;
};

export const Loading: Story = () => {
     React.useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async () => new Promise(() => {}); // Never resolves
        return () => { window.fetch = originalFetch; };
    }, []);
    return <ProductCatalog token="mock-token" />;
};

export const Error: Story = () => {
     React.useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async () => { throw new Error("Failed to fetch"); };
        return () => { window.fetch = originalFetch; };
    }, []);
    return <ProductCatalog token="mock-token" />;
};
