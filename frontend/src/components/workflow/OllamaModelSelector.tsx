import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  HardDrive
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';

interface OllamaModel {
  name: string;
  displayName: string;
  description: string;
  size: string;
  recommended?: boolean;
  installed?: boolean;
}

const POPULAR_MODELS: OllamaModel[] = [
  {
    name: 'llama3.2',
    displayName: 'Llama 3.2 (3B)',
    description: 'Latest Meta model, great for general tasks',
    size: '2GB',
    recommended: true
  },
  {
    name: 'llama3.2:1b',
    displayName: 'Llama 3.2 (1B)',
    description: 'Smaller, faster version',
    size: '1.3GB'
  },
  {
    name: 'mistral',
    displayName: 'Mistral 7B',
    description: 'Excellent for coding and reasoning',
    size: '4.1GB',
    recommended: true
  },
  {
    name: 'codellama',
    displayName: 'Code Llama',
    description: 'Specialized for code generation',
    size: '3.8GB',
    recommended: true
  },
  {
    name: 'phi3',
    displayName: 'Phi-3 Mini',
    description: 'Microsoft small but capable model',
    size: '2.2GB'
  },
  {
    name: 'gemma2',
    displayName: 'Gemma 2 (9B)',
    description: 'Google open model',
    size: '5.4GB'
  },
  {
    name: 'qwen2.5',
    displayName: 'Qwen 2.5 (7B)',
    description: 'Alibaba multilingual model',
    size: '4.4GB'
  }
];

interface OllamaModelSelectorProps {
  value?: string;
  onChange: (model: string) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

export function OllamaModelSelector({ 
  value, 
  onChange,
  onConnectionStatusChange 
}: OllamaModelSelectorProps) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState(0);

  const OLLAMA_URL = 'http://localhost:11434';

  // Check Ollama connection
  const checkConnection = async () => {
    setChecking(true);
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((m: any) => m.name) || [];
        setInstalledModels(models);
        setConnected(true);
        onConnectionStatusChange?.(true);
      } else {
        setConnected(false);
        onConnectionStatusChange?.(false);
      }
    } catch {
      setConnected(false);
      onConnectionStatusChange?.(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Pull a model
  const pullModel = async (modelName: string) => {
    setPulling(modelName);
    setPullProgress(0);

    try {
      const response = await fetch(`${OLLAMA_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true })
      });

      if (!response.ok) throw new Error('Failed to pull model');

      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.completed && data.total) {
              setPullProgress(Math.round((data.completed / data.total) * 100));
            }
            if (data.status === 'success') {
              setInstalledModels(prev => [...prev, modelName]);
              onChange(modelName);
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error('Failed to pull model:', error);
    } finally {
      setPulling(null);
      setPullProgress(0);
    }
  };

  // Get models with installed status
  const modelsWithStatus = POPULAR_MODELS.map(model => ({
    ...model,
    installed: installedModels.some(m => m.startsWith(model.name.split(':')[0]))
  }));

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking Ollama connection...
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-yellow-600">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm">Ollama not detected</span>
        </div>
        
        <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
          <p className="font-medium">To use local models:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Install Ollama from <a href="https://ollama.ai" target="_blank" className="text-primary hover:underline">ollama.ai</a></li>
            <li>Run <code className="px-1 py-0.5 bg-background rounded">ollama serve</code></li>
            <li>Pull a model: <code className="px-1 py-0.5 bg-background rounded">ollama pull llama3.2</code></li>
          </ol>
        </div>

        <Button variant="outline" size="sm" onClick={checkConnection}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="h-4 w-4" />
          <span className="text-sm">Ollama connected</span>
        </div>
        <Button variant="ghost" size="sm" onClick={checkConnection}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Model Selector */}
      <div className="space-y-2">
        <Label>Select Model</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a model..." />
          </SelectTrigger>
          <SelectContent>
            {/* Installed Models */}
            {installedModels.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Installed Models
                </div>
                {installedModels.map(model => (
                  <SelectItem key={model} value={model}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      {model}
                    </div>
                  </SelectItem>
                ))}
                <div className="my-1 border-t" />
              </>
            )}

            {/* Popular Models */}
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Popular Models
            </div>
            {modelsWithStatus
              .filter(m => !m.installed)
              .map(model => (
                <SelectItem key={model.name} value={model.name} disabled>
                  <div className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    {model.displayName}
                    <span className="text-xs text-muted-foreground">({model.size})</span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Cards for Installation */}
      <div className="space-y-2">
        <Label>Available Models</Label>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {modelsWithStatus.map(model => (
            <div 
              key={model.name}
              className={`p-3 rounded-lg border ${
                model.installed 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.displayName}</span>
                    {model.recommended && (
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    )}
                    {model.installed && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">
                        Installed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{model.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <HardDrive className="h-3 w-3" />
                    {model.size}
                  </div>
                </div>
                
                {!model.installed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pullModel(model.name)}
                    disabled={!!pulling}
                  >
                    {pulling === model.name ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        {pullProgress}%
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Pull
                      </>
                    )}
                  </Button>
                )}

                {model.installed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(model.name)}
                    className={value === model.name ? 'bg-primary text-primary-foreground' : ''}
                  >
                    {value === model.name ? 'Selected' : 'Select'}
                  </Button>
                )}
              </div>

              {/* Pull Progress */}
              {pulling === model.name && pullProgress > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pullProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground">
        <span className="text-green-500">●</span> Ollama runs locally - completely free, no API keys needed
      </div>
    </div>
  );
}

export default OllamaModelSelector;
