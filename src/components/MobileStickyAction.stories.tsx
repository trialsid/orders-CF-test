import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import MobileStickyAction from './MobileStickyAction';

export const Default: Story = () => (
    <div className="h-screen w-full bg-slate-100 dark:bg-slate-800 p-4 relative">
        <p>Resize window to mobile width to see the sticky action.</p>
        <MobileStickyAction 
            label="Proceed to Checkout" 
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => console.log('Clicked')}
        />
    </div>
);

export const WithBadgeAndHelper: Story = () => (
    <div className="h-screen w-full bg-slate-100 dark:bg-slate-800 p-4 relative">
        <p>Resize window to mobile width.</p>
        <MobileStickyAction 
            label="View Cart" 
            helperText="₹500 total"
            badge="5 items"
            onClick={() => console.log('Clicked')}
        />
    </div>
);

export const WithSecondaryAction: Story = () => (
    <div className="h-screen w-full bg-slate-100 dark:bg-slate-800 p-4 relative">
        <p>Resize window to mobile width.</p>
        <MobileStickyAction 
            label="Confirm Order" 
            secondaryLabel="Back"
            onSecondaryClick={() => console.log('Back')}
            onClick={() => console.log('Confirm')}
        />
    </div>
);

export const AnimatedVisibility: Story = () => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="h-screen w-full bg-slate-100 dark:bg-slate-800 p-4 relative flex flex-col items-start gap-4">
            <button 
                onClick={() => setIsVisible(!isVisible)}
                className="px-4 py-2 bg-blue-500 text-white rounded shadow-md"
            >
                {isVisible ? 'Hide Action Bar' : 'Show Action Bar'}
            </button>
            <p className="text-slate-500 dark:text-slate-400">Click the button to animate the sticky action bar.</p>
            <MobileStickyAction 
                label="Animated Action" 
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => console.log('Animated Clicked')}
                hidden={!isVisible} // Control visibility
                containerClassName="transition-all duration-500 ease-in-out transform data-[hidden=true]:translate-y-full data-[hidden=true]:opacity-0"
            />
        </div>
    );
};
