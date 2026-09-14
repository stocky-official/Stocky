import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stocky-bg-global px-4 text-center">
      <h2 className="text-3xl font-medium text-stocky-text-main mb-2">Page Not Found</h2>
      <p className="text-stocky-text-muted text-sm max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/platform"
        className="inline-flex items-center justify-center rounded-full bg-stocky-primary text-white font-medium px-5 py-2.5 text-xs hover:bg-stocky-primary-hover transition-colors"
      >
        Back to platform
      </Link>
    </div>
  );
}
