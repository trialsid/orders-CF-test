import type { Story } from '@ladle/react';
import React, { useState, useCallback } from 'react';
import Toast, { ToastMessage } from './Toast';

export const Success: Story = () => (
  <div className="fixed bottom-4 right-4 z-50">
    <Toast
      toast={{ id: 1, type: 'success', title: 'Order Placed', description: 'Your order #1234 has been confirmed.' }}
      onDismiss={(id) => console.log('Dismiss', id)}
      duration={999999} // Keep it visible for the story
    />
  </div>
);

export const Error: Story = () => (
  <div className="fixed bottom-4 right-4 z-50">
    <Toast
      toast={{ id: 2, type: 'error', title: 'Submission Failed', description: 'Please check your internet connection.' }}
      onDismiss={(id) => console.log('Dismiss', id)}
      duration={999999} // Keep it visible for the story
    />
  </div>
);

export const Interactive: Story = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((type: 'success' | 'error', title: string, description?: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, description }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    React.useEffect(() => {
        // Add an initial toast after a short delay
        const timer = setTimeout(() => {
            addToast('success', 'Welcome!', 'This is an interactive toast example.');
        }, 500);
        return () => clearTimeout(timer);
    }, [addToast]);

    return (
        <div className="min-h-[200px] w-full relative p-4">
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onDismiss={removeToast} duration={3000} />
                ))}
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
                <button 
                    onClick={() => addToast('success', 'Success!', `Item added at ${new Date().toLocaleTimeString()}`)}
                    className="px-3 py-1 bg-emerald-500 text-white rounded shadow-md"
                >
                    Add Success Toast
                </button>
                <button 
                    onClick={() => addToast('error', 'Error!', `Action failed at ${new Date().toLocaleTimeString()}`)}
                    className="px-3 py-1 bg-rose-500 text-white rounded shadow-md"
                >
                    Add Error Toast
                </button>
            </div>
            <p className="mt-20 text-slate-500 dark:text-slate-400">Toasts will appear at the bottom right and auto-dismiss.</p>
        </div>
    );
};
