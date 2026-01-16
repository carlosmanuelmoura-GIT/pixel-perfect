import { Link } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Acesso Negado
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Não tem permissões para aceder a esta página. 
          Contacte o administrador se acha que isto é um erro.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </Button>
          <Button asChild>
            <Link to="/" className="gap-2">
              <Home className="w-4 h-4" />
              Ir para o Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
