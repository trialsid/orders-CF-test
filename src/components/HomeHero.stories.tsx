import type { Story } from '@ladle/react';
import { action } from '@ladle/react';
import HomeHero from './HomeHero';
import { mockProducts } from '../../.ladle/mocks';

// Define the arguments (controls) available in the UI
interface HomeHeroArgs {
  highlightCount: number;
  loading: boolean;
}

export const Default: Story<HomeHeroArgs> = ({ highlightCount, loading }) => (
  <HomeHero 
    highlights={loading ? [] : mockProducts.slice(0, highlightCount)} 
    onBrowse={action('onBrowse')} 
  />
);

Default.args = {
  highlightCount: 3,
  loading: false,
};

Default.argTypes = {
  highlightCount: {
    control: { type: 'range', min: 0, max: 5, step: 1 },
  },
  loading: {
      control: { type: 'boolean' }
  }
};
