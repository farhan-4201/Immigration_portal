import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="glass p-8 w-full max-w-md text-center animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="p-4 rounded-full bg-error/10 mb-4">
            <ShieldAlert className="w-12 h-12 text-error" />
          </div>
          <h1 className="text-3xl font-bold text-error">Access Denied</h1>
          <p className="text-text-muted mt-4">
            You do not have the required permissions to access this resource. 
            This attempt has been logged for security review.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <Link href="/" className="btn-primary flex items-center justify-center gap-2">
            Return to Dashboard
          </Link>
          <Link href="/login" className="btn-secondary flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        <p className="mt-8 text-xs text-text-muted">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
