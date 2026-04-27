import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

// OAuth callback page that handles the redirect from OAuth providers
// This page exchanges the authorization code for tokens and communicates with the opener window
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        setStatus('error');
        setMessage(errorDescription || `Authentication failed: ${error}`);
        notifyOpener({ success: false, error: errorDescription || error });
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code or state parameter');
        notifyOpener({ success: false, error: 'Missing parameters' });
        return;
      }

      // Verify state to prevent CSRF attacks
      const storedState = sessionStorage.getItem('oauth_state');
      if (storedState !== state) {
        setStatus('error');
        setMessage('Invalid state parameter. Please try again.');
        notifyOpener({ success: false, error: 'Invalid state' });
        return;
      }

      try {
        // Decode state to get provider info
        const stateData = JSON.parse(atob(state));
        const { providerId } = stateData;

        setMessage(`Connecting to ${providerId}...`);

        // Exchange the code for tokens via our backend
        const response = await api.exchangeOAuthCode(code, state);

        if (response.connection) {
          setStatus('success');
          setMessage(`Successfully connected to ${providerId}!`);
          
          // Clear the stored state
          sessionStorage.removeItem('oauth_state');
          
          // Notify the opener window
          notifyOpener({
            success: true,
            connection: response.connection,
            providerId,
          });
        } else {
          throw new Error('No connection returned');
        }
      } catch (err: unknown) {
        console.error('OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication';
        setStatus('error');
        setMessage(errorMessage);
        notifyOpener({ success: false, error: errorMessage });
      }
    };

    handleCallback();
  }, [searchParams]);

  // Notify the opener window (for popup flow) or redirect (for redirect flow)
  const notifyOpener = (data: { success: boolean; connection?: any; providerId?: string; error?: string }) => {
    // Try to communicate with opener window
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(
          { type: 'OAUTH_CALLBACK', ...data },
          window.location.origin
        );
        
        // Close this popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } catch (e) {
        console.error('Failed to communicate with opener:', e);
      }
    } else {
      // No opener - this was a full redirect flow
      // Redirect back to connections page after a delay
      setTimeout(() => {
        window.location.href = '/dashboard/connections';
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-green-500/10 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-500/10 rounded-full">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          )}
        </div>
        
        <h1 className="text-xl font-semibold mb-2">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Connected!'}
          {status === 'error' && 'Connection Failed'}
        </h1>
        
        <p className="text-muted-foreground text-sm">
          {message}
        </p>
        
        {status !== 'loading' && (
          <p className="text-xs text-muted-foreground mt-4">
            {window.opener ? 'This window will close automatically...' : 'Redirecting...'}
          </p>
        )}
      </div>
    </div>
  );
}
