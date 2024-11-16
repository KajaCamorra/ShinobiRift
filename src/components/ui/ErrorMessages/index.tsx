import { AlertCircle, Wifi, Lock, Server } from 'lucide-react';

interface ErrorMessageProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function ErrorMessage({ title, message, icon, action }: ErrorMessageProps) {
  return (
    <div className="p-4 bg-bright-blue/5 border border-bright-blue/10 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="text-bright-blue">
          {icon || <AlertCircle className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="font-goldman text-bright-blue mb-1">{title}</h3>
          <p className="text-text/80 text-sm">{message}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

export function NetworkError({ retry }: { retry?: () => void }) {
  return (
    <ErrorMessage
      icon={<Wifi className="w-5 h-5" />}
      title="Connection Error"
      message="Please check your internet connection and try again."
      action={
        retry && (
          <button
            onClick={retry}
            className="text-sm text-bright-blue hover:text-bright-blue/80"
          >
            Retry
          </button>
        )
      }
    />
  );
}

export function AuthError() {
  return (
    <ErrorMessage
      icon={<Lock className="w-5 h-5" />}
      title="Authentication Error"
      message="Your session has expired. Please log in again."
      action={
        <button
          onClick={() => window.location.href = '/login'}
          className="text-sm text-bright-blue hover:text-bright-blue/80"
        >
          Go to Login
        </button>
      }
    />
  );
}

export function ServerError() {
  return (
    <ErrorMessage
      icon={<Server className="w-5 h-5" />}
      title="Server Error"
      message="We're experiencing technical difficulties. Please try again later."
    />
  );
}