import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Loader from './Loader';

describe('Loader', () => {
  it('renders default loading text', () => {
    render(<Loader />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom text', () => {
    render(<Loader text="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });
});
