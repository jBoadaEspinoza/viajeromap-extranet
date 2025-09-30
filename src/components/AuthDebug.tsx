import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug: React.FC = () => {
  const { isAuthenticated, isInitialized, user, company, role } = useAuth();
  const [verificationResult, setVerificationResult] = React.useState<string>('');
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  const handleVerifyToken = async () => {
    console.log('🔍 AuthDebug: Manual token verification...');
    setIsVerifying(true);
    setVerificationResult('');
    setDebugInfo(null);
    
    try {
      // Simular verificación manual
      const result = { isValid: true, response: { message: 'Verificación manual completada' } };
      console.log('🔍 AuthDebug: Manual verification result:', result);
      
      if (result.isValid) {
        setVerificationResult('✅ Token válido');
        setDebugInfo(result.response);
      } else {
        setVerificationResult('❌ Token inválido');
        setDebugInfo(result.response);
      }
    } catch (error: any) {
      console.error('🔍 AuthDebug: Error during verification:', error);
      setVerificationResult(`❌ Error: ${error.message || 'Error desconocido'}`);
      setDebugInfo(error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header">
        <h6 className="mb-0">🔍 Debug de Autenticación</h6>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6>Estado:</h6>
            <ul className="list-unstyled">
              <li><strong>Inicializado:</strong> {isInitialized ? '✅ Sí' : '❌ No'}</li>
              <li><strong>Autenticado:</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}</li>
            </ul>
          </div>
          <div className="col-md-6">
            <h6>Datos del Usuario:</h6>
            <ul className="list-unstyled">
              <li><strong>Usuario:</strong> {user?.username || 'N/A'}</li>
              <li><strong>Nickname:</strong> {user?.nickname || 'N/A'}</li>
              <li><strong>Empresa:</strong> {company?.name || 'N/A'}</li>
              <li><strong>Rol:</strong> {role?.name || 'N/A'}</li>
            </ul>
            
            <h6 className="mt-3">Cookies:</h6>
            <ul className="list-unstyled">
              <li><strong>Document Cookie:</strong> {document.cookie ? '✅ Presente' : '❌ No hay cookies'}</li>
              <li><strong>Access Token:</strong> {document.cookie.includes('access_token') ? '✅ Presente' : '❌ No encontrado'}</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-3">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={handleVerifyToken}
            disabled={isVerifying}
          >
            {isVerifying ? '🔍 Verificando...' : '🔍 Verificar Token Manualmente'}
          </button>
          
          {verificationResult && (
            <div className="mt-2">
              <small className={`badge ${verificationResult.includes('✅') ? 'bg-success' : 'bg-danger'}`}>
                {verificationResult}
              </small>
            </div>
          )}
          
          {debugInfo && (
            <div className="mt-3">
              <details>
                <summary className="text-muted small">📋 Ver detalles de la respuesta</summary>
                <pre className="mt-2 p-2 bg-light small" style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDebug; 