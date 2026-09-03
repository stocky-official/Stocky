import { LandingView } from '@/views/landing/LandingView';

/**
 * Root Route Page
 * Conforms to Critical Rule 5:
 * Delegates directly to the LandingView PageView.
 */
export default function Page() {
  return <LandingView />;
}
