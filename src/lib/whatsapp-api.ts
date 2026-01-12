// WhatsApp API Integration Service
// WUZAPI - https://weeb.inoovaweb.com.br/

// Usar proxy em desenvolvimento para evitar CORS
const IS_DEV = import.meta.env.DEV;
const WHATSAPP_API_URL = IS_DEV 
  ? '/api/whatsapp'  // Proxy no Vite
  : (import.meta.env.VITE_WHATSAPP_API_URL || 'https://weeb.inoovaweb.com.br');
const WUZAPI_ADMIN_TOKEN = import.meta.env.VITE_WUZAPI_ADMIN_TOKEN || '44507d94623ef3c92c7c8b908b786836';

// Remover barra final da URL se existir
const API_BASE_URL = WHATSAPP_API_URL.replace(/\/$/, '');

export interface CreateInstanceParams {
  instanceName: string;
  phoneNumber: string;
  qrcode?: boolean;
  integration?: string;
}

export interface InstanceResponse {
  success: boolean;
  instance?: {
    instanceName: string;
    token: string;
    status: string;
  };
  message?: string;
  error?: string;
}

export interface ConnectionStatus {
  status: 'online' | 'offline' | 'connecting' | 'disconnected';
  qrcode?: string;
  message?: string;
}

/**
 * Cria um usuário no WUZAPI (necessário antes de conectar)
 */
export async function createWuzapiUser(
  name: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': WUZAPI_ADMIN_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        token: token,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Se o usuário já existe, não é erro
      if (response.status === 409 || data.error?.includes('already exists')) {
        return { success: true };
      }
      return {
        success: false,
        error: data.error || data.message || 'Erro ao criar usuário',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error creating WUZAPI user:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar usuário',
    };
  }
}

/**
 * Cria uma nova instância do WhatsApp (WUZAPI)
 * Primeiro cria o usuário, depois conecta
 */
export async function createWhatsAppInstance(
  params: CreateInstanceParams,
  apiToken?: string
): Promise<InstanceResponse> {
  try {
    // Gerar token único para o usuário baseado no nome da instância
    const userToken = apiToken || `${params.instanceName}_${Date.now()}`;

    // 1. Criar usuário no WUZAPI
    const userResult = await createWuzapiUser(params.instanceName, userToken);
    if (!userResult.success) {
      return {
        success: false,
        error: userResult.error || 'Erro ao criar usuário',
      };
    }

    // Na WUZAPI, após criar o usuário, o QR code é obtido via GET /session/qrcode
    // O QR code será obtido separadamente no componente

    return {
      success: true,
      instance: {
        instanceName: params.instanceName,
        token: userToken,
        status: 'connecting',
      },
      message: 'Usuário criado e pronto para conectar',
    };
  } catch (error: any) {
    console.error('Error creating WhatsApp instance:', error);
    return {
      success: false,
      error: error.message || 'Erro ao conectar com a API do WhatsApp',
    };
  }
}

/**
 * Verifica o status de uma instância (WUZAPI)
 */
export async function getInstanceStatus(
  instanceName: string,
  apiToken: string
): Promise<ConnectionStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/session/status`, {
      method: 'GET',
      headers: {
        'Token': apiToken,
        'Content-Type': 'application/json',
      },
    });

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.error('Failed to parse JSON response:', text);
      return {
        status: 'offline',
        message: 'Erro ao processar resposta da API',
      };
    }

    console.log('Status check raw response:', {
      status: response.status,
      ok: response.ok,
      data,
    });

    if (!response.ok) {
      return {
        status: 'offline',
        message: data.error || data.message || `Erro ao verificar status (${response.status})`,
      };
    }

    // Segundo a documentação WUZAPI: { "code": 200, "data": { "Connected": true, "LoggedIn": true }, "success": true }
    // Verificar se está conectado E logado
    // A API pode retornar os campos com diferentes capitalizações
    const connected = data.data?.Connected ?? data.data?.connected ?? data.Connected ?? data.connected;
    const loggedIn = data.data?.LoggedIn ?? data.data?.loggedIn ?? data.LoggedIn ?? data.loggedIn;
    
    const isConnected = connected === true && loggedIn === true;
    
    console.log('Status check parsed:', {
      connected,
      loggedIn,
      isConnected,
      dataStructure: {
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : [],
        topLevelKeys: Object.keys(data),
      },
    });
    
    return {
      status: isConnected ? 'online' : 'offline',
      message: isConnected ? 'Conectado' : 'Desconectado',
    };
  } catch (error: any) {
    console.error('Error checking instance status:', error);
    return {
      status: 'offline',
      message: error.message || 'Erro ao verificar status',
    };
  }
}

/**
 * Obtém o QR Code da instância (WUZAPI)
 * Segundo a documentação: GET /session/qr retorna { "code": 200, "data": { "QRCode": "data:image/png;base64,..." }, "success": true }
 */
export async function getInstanceQRCode(
  instanceName: string,
  apiToken: string
): Promise<string | null> {
  try {
    // Primeiro, tentar conectar a sessão se não estiver conectada
    // Isso é necessário para gerar o QR code
    try {
      const connectResponse = await fetch(`${API_BASE_URL}/session/connect`, {
        method: 'POST',
        headers: {
          'Token': apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Immediate: false, // Aguardar para obter QR code
        }),
      });
      
      console.log('Connect response status:', connectResponse.status);
      // Não importa se falhar, pode já estar conectado
    } catch (connectError) {
      console.log('Connect attempt (may already be connected):', connectError);
      // Continuar mesmo se falhar
    }

    // Segundo a documentação WUZAPI: GET /session/qr
    const response = await fetch(`${API_BASE_URL}/session/qr`, {
      method: 'GET',
      headers: {
        'Token': apiToken,
        'Content-Type': 'application/json',
      },
    });

    console.log('QR Code response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('QR Code response data:', data);
      
      // Segundo a documentação: { "code": 200, "data": { "QRCode": "data:image/png;base64,..." }, "success": true }
      if (data.success && data.data?.QRCode) {
        const qrCode = data.data.QRCode;
        
        // Se já está no formato data:image, retornar direto
        if (qrCode.startsWith('data:image')) {
          return qrCode;
        }
        
        // Se é base64 puro, adicionar prefixo
        if (qrCode && typeof qrCode === 'string') {
          return `data:image/png;base64,${qrCode}`;
        }
      }
      
      // Fallback para outros formatos possíveis
      if (data.data?.qrcode) {
        const qr = data.data.qrcode;
        return qr.startsWith('data:image') ? qr : `data:image/png;base64,${qr}`;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('QR Code endpoint error:', errorData);
    }

    // Fallback: Tentar extrair QR code da página de login como último recurso
    try {
      const loginUrl = `${API_BASE_URL}/login?token=${apiToken}`;
      const response = await fetch(loginUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });

      if (response.ok) {
        const html = await response.text();
        
        // Tentar encontrar base64 direto no HTML
        const base64Match = html.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
        if (base64Match && base64Match[1]) {
          return `data:image/png;base64,${base64Match[1]}`;
        }

        // Tentar encontrar img com src contendo base64 ou data:image
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch && imgMatch[1]) {
          const imgSrc = imgMatch[1];
          if (imgSrc.startsWith('data:image') || imgSrc.includes('base64')) {
            return imgSrc.startsWith('data:image') ? imgSrc : `data:image/png;base64,${imgSrc}`;
          }
        }
      }
    } catch (htmlError) {
      console.error('Error extracting QR code from login page:', htmlError);
    }

    // Se nada funcionou, retornar null
    console.error('Could not extract QR code from any source');
    return null;
  } catch (error: any) {
    console.error('Error getting QR code:', error);
    return null;
  }
}

/**
 * Gera código de pareamento para conectar via telefone (WUZAPI)
 * Segundo a documentação: POST /session/pairphone retorna LinkingCode
 * Exemplo de resposta: { "code": 200, "data": { "LinkingCode": "9H3J-H3J8" }, "success": true }
 * 
 * Nota: Pode ser necessário conectar a sessão primeiro antes de gerar o código
 */
export async function generatePairCode(
  apiToken: string,
  phoneNumber: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    console.log('Generating pair code:', {
      url: `${API_BASE_URL}/session/pairphone`,
      token: apiToken,
      phone: cleanPhone,
    });

    // Primeiro, tentar conectar a sessão se não estiver conectada
    // Isso pode ser necessário antes de gerar o código de pareamento
    try {
      const connectResponse = await fetch(`${API_BASE_URL}/session/connect`, {
        method: 'POST',
        headers: {
          'Token': apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Immediate: true, // Retornar imediatamente sem esperar
        }),
      });
      
      console.log('Connect response status:', connectResponse.status);
      // Não importa se falhar, pode já estar conectado
    } catch (connectError) {
      console.log('Connect attempt (may already be connected):', connectError);
      // Continuar mesmo se falhar
    }
    
    // Segundo a documentação: POST /session/pairphone com { "Phone": "5491155553934" }
    const response = await fetch(`${API_BASE_URL}/session/pairphone`, {
      method: 'POST',
      headers: {
        'Token': apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Phone: cleanPhone, // Capitalizado conforme documentação
      }),
    });

    console.log('Generate pair code response status:', response.status);
    
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      return {
        success: false,
        error: text || 'Erro ao gerar código de pareamento',
      };
    }

    console.log('Generate pair code response data:', data);

    if (!response.ok || !data.success) {
      // Se o erro for "no session", tentar conectar primeiro e depois gerar código novamente
      if (data.error === 'no session' || data.error?.includes('session')) {
        console.log('No session found, attempting to connect first...');
        
        // Tentar conectar e aguardar um pouco
        try {
          const connectResponse = await fetch(`${API_BASE_URL}/session/connect`, {
            method: 'POST',
            headers: {
              'Token': apiToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              Immediate: false, // Aguardar conexão
            }),
          });
          
          if (connectResponse.ok) {
            // Aguardar um pouco para a sessão ser estabelecida
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Tentar gerar código novamente
            const retryResponse = await fetch(`${API_BASE_URL}/session/pairphone`, {
              method: 'POST',
              headers: {
                'Token': apiToken,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                Phone: cleanPhone,
              }),
            });
            
            const retryData = await retryResponse.json();
            
            if (retryResponse.ok && retryData.success) {
              const linkingCode = retryData.data?.LinkingCode || retryData.LinkingCode;
              if (linkingCode) {
                return {
                  success: true,
                  code: String(linkingCode),
                };
              }
            }
          }
        } catch (retryError) {
          console.error('Error retrying after connect:', retryError);
        }
      }
      
      return {
        success: false,
        error: data.error || data.message || `Erro ao gerar código (${response.status})`,
      };
    }

    // Segundo a documentação, o código vem em data.LinkingCode
    // Exemplo: { "code": 200, "data": { "LinkingCode": "9H3J-H3J8" }, "success": true }
    const linkingCode = data.data?.LinkingCode || data.LinkingCode;
    
    if (linkingCode) {
      return {
        success: true,
        code: String(linkingCode),
      };
    }

    return {
      success: false,
      error: 'Código de pareamento não encontrado na resposta',
    };
  } catch (error: any) {
    console.error('Error generating pair code:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar código de pareamento',
    };
  }
}

/**
 * Valida código de verificação recebido do WhatsApp (WUZAPI)
 * Nota: A documentação não especifica um endpoint separado para validar o código.
 * O processo pode ser automático após inserir o LinkingCode no WhatsApp.
 * Esta função verifica o status da conexão após o usuário inserir o código.
 * 
 * Alternativamente, pode ser necessário chamar /session/pairphone novamente com o código.
 */
export async function pairPhone(
  apiToken: string,
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    console.log('Validating pair code:', {
      url: `${API_BASE_URL}/session/pairphone`,
      token: apiToken,
      phone: cleanPhone,
      code: code,
    });

    // Tentar enviar o código de verificação para o endpoint
    // A documentação não especifica, mas pode aceitar o código no mesmo endpoint
    const response = await fetch(`${API_BASE_URL}/session/pairphone`, {
      method: 'POST',
      headers: {
        'Token': apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Phone: cleanPhone,
        Code: code, // Tentar enviar o código de verificação
      }),
    });

    console.log('Pair phone validation response status:', response.status);
    
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      // Se falhar, verificar status da conexão
      return await checkConnectionStatus(apiToken);
    }

    console.log('Pair phone validation response data:', data);

    if (response.ok && data.success) {
      return {
        success: true,
        message: data.data?.Details || data.message || 'Conectado com sucesso via código',
      };
    }

    // Se não funcionou, verificar status da conexão
    return await checkConnectionStatus(apiToken);
  } catch (error: any) {
    console.error('Error validating pair code:', error);
    // Em caso de erro, verificar status
    return await checkConnectionStatus(apiToken);
  }
}

/**
 * Verifica o status da conexão como fallback
 */
async function checkConnectionStatus(apiToken: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const statusResponse = await getInstanceStatus('', apiToken);
    
    if (statusResponse.status === 'online') {
      return {
        success: true,
        message: 'Conectado com sucesso',
      };
    }

    return {
      success: false,
      error: 'Aguardando validação do código. Verifique se inseriu o código corretamente no WhatsApp e tente novamente.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao verificar status da conexão',
    };
  }
}

/**
 * Verifica se um número tem WhatsApp (WUZAPI)
 * POST /user/check - Checks if user has WhatsApp
 * 
 * Formato da requisição conforme documentação:
 * {
 *   "Phone": ["5491155553934", "5491155553935"]
 * }
 * 
 * Formato da resposta:
 * {
 *   "code": 200,
 *   "data": {
 *     "Users": [
 *       {
 *         "IsInWhatsapp": true,
 *         "JID": "5491155553934@s.whatsapp.net",
 *         "Query": "5491155553934",
 *         "VerifiedName": "Company Name"
 *       }
 *     ]
 *   },
 *   "success": true
 * }
 */
export async function checkWhatsAppUser(
  apiToken: string,
  phoneNumber: string
): Promise<{ success: boolean; exists?: boolean; jid?: string; formattedPhone?: string; error?: string }> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    console.log('🔍 checkWhatsAppUser: Verificando número:', cleanPhone);

    // Segundo a documentação, Phone deve ser um array
    const response = await fetch(`${API_BASE_URL}/user/check`, {
      method: 'POST',
      headers: {
        'Token': apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Phone: [cleanPhone], // Array de números conforme documentação
      }),
    });

    const responseText = await response.text();
    console.log('🔍 checkWhatsAppUser: Status:', response.status, 'Response:', responseText);
    
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: responseText || 'Resposta inválida' };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Erro ao verificar número',
      };
    }

    // Processar resposta conforme documentação
    // data.data.Users é um array de objetos
    if (data.success && data.data?.Users && Array.isArray(data.data.Users) && data.data.Users.length > 0) {
      const user = data.data.Users[0]; // Pegar o primeiro resultado
      const exists = user.IsInWhatsapp === true;
      const jid = user.JID || null;
      const formattedPhone = jid ? jid.split('@')[0] : cleanPhone;

      console.log('✅ checkWhatsAppUser: Resultado:', {
        exists,
        jid,
        formattedPhone,
        verifiedName: user.VerifiedName,
      });

      return {
        success: true,
        exists: exists,
        jid: jid,
        formattedPhone: formattedPhone,
      };
    }

    // Se não encontrou o usuário na resposta
    return {
      success: false,
      error: 'Número não encontrado na resposta da API',
    };
  } catch (error: any) {
    console.error('❌ Error checking WhatsApp user:', error);
    return {
      success: false,
      error: error.message || 'Erro ao verificar número',
    };
  }
}

/**
 * Envia uma mensagem de texto (WUZAPI)
 * Primeiro verifica se o número tem WhatsApp usando /user/check
 */
export async function sendTextMessage(
  instanceName: string,
  phoneNumber: string,
  message: string,
  apiToken: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Primeiro, verificar se o número tem WhatsApp (obrigatório)
    console.log('📤 sendTextMessage: Verificando número antes de enviar...');
    const checkResult = await checkWhatsAppUser(apiToken, phoneNumber);
    
    if (!checkResult.success) {
      console.error('❌ Erro ao verificar número:', checkResult.error);
      return {
        success: false,
        error: checkResult.error || 'Erro ao verificar número',
      };
    }

    if (!checkResult.exists) {
      console.error('❌ Número não possui WhatsApp');
      return {
        success: false,
        error: 'Este número não possui WhatsApp',
      };
    }

    // Usar o número formatado retornado pela verificação
    // O número deve estar no formato internacional sem + e sem @s.whatsapp.net
    let verifiedPhone = checkResult.formattedPhone || phoneNumber.replace(/\D/g, '');
    
    // Remover @s.whatsapp.net se presente
    verifiedPhone = verifiedPhone.replace(/@s\.whatsapp\.net$/, '');
    
    // Garantir que o número está no formato correto (apenas dígitos)
    verifiedPhone = verifiedPhone.replace(/\D/g, '');
    
    console.log('✅ Número verificado e formatado:', verifiedPhone, 'JID:', checkResult.jid);

    // Segundo a documentação WUZAPI: POST /chat/send/text
    // Formato do payload conforme documentação:
    // {
    //   "Phone": "5491155553935",
    //   "Body": "How you doin",
    //   "LinkPreview": true (opcional),
    //   ...
    // }
    const payload = {
      Phone: verifiedPhone, // Número verificado (sem @s.whatsapp.net)
      Body: message, // Mensagem de texto
    };
    
    console.log('📤 sendTextMessage: Enviando mensagem com payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/chat/send/text`, {
      method: 'POST',
      headers: {
        'Token': apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data: any = {};
    const responseText = await response.text();
    console.log('📤 sendTextMessage: Response status:', response.status);
    console.log('📤 sendTextMessage: Response text:', responseText);
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Erro ao fazer parse da resposta:', e);
      data = { error: responseText || 'Resposta inválida' };
    }

    if (!response.ok) {
      console.error('❌ Erro ao enviar mensagem:', data);
      return {
        success: false,
        error: data.error || data.message || data.data?.message || 'Erro ao enviar mensagem',
      };
    }
    
    console.log('✅ Mensagem enviada com sucesso:', data);

    return {
      success: true,
      message: 'Mensagem enviada com sucesso',
    };
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    return {
      success: false,
      error: error.message || 'Erro ao enviar mensagem',
    };
  }
}

/**
 * Obtém informações do usuário conectado (WUZAPI)
 * Segundo a documentação: GET /admin/users retorna lista de usuários com jid, name, connected, loggedIn
 */
export async function getUserInfo(
  apiToken: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 getUserInfo: Buscando usuário com token:', apiToken?.substring(0, 10) + '...');
    
    // Primeiro, buscar lista de usuários para encontrar o usuário pelo token
    const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': WUZAPI_ADMIN_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 getUserInfo: Response status:', usersResponse.status);

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('❌ getUserInfo: Erro na resposta:', errorText);
      return {
        success: false,
        error: 'Erro ao buscar informações do usuário',
      };
    }

    const usersData = await usersResponse.json();
    console.log('🔍 getUserInfo: Dados recebidos:', {
      success: usersData.success,
      isArray: Array.isArray(usersData.data),
      count: Array.isArray(usersData.data) ? usersData.data.length : 0,
      users: Array.isArray(usersData.data) ? usersData.data.map((u: any) => ({
        name: u.name,
        token: u.token?.substring(0, 10) + '...',
        jid: u.jid,
      })) : null,
    });
    
    if (!usersData.success || !Array.isArray(usersData.data)) {
      console.error('❌ getUserInfo: Formato inválido:', usersData);
      return {
        success: false,
        error: 'Formato de resposta inválido',
      };
    }

    // Encontrar o usuário pelo token
    const user = usersData.data.find((u: any) => u.token === apiToken);
    
    console.log('🔍 getUserInfo: Usuário encontrado?', !!user);
    if (user) {
      console.log('✅ getUserInfo: Dados do usuário:', {
        id: user.id,
        name: user.name,
        jid: user.jid,
        connected: user.connected,
        loggedIn: user.loggedIn,
      });
    }
    
    if (!user) {
      console.error('❌ getUserInfo: Usuário não encontrado. Tokens disponíveis:', 
        usersData.data.map((u: any) => u.token?.substring(0, 10) + '...')
      );
      return {
        success: false,
        error: 'Usuário não encontrado',
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        jid: user.jid,
        connected: user.connected,
        loggedIn: user.loggedIn,
        webhook: user.webhook,
        events: user.events,
      },
    };
  } catch (error: any) {
    console.error('❌ getUserInfo: Erro geral:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar informações do usuário',
    };
  }
}

/**
 * Obtém a foto de perfil do WhatsApp (WUZAPI)
 * Segundo a documentação: POST /user/avatar com Phone e Preview
 * Retorna: { "URL": "...", "ID": "...", "Type": "preview", "DirectPath": "..." }
 */
export async function getUserAvatar(
  apiToken: string,
  phoneNumber: string,
  preview: boolean = true
): Promise<{ success: boolean; url?: string; id?: string; error?: string }> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    console.log('🖼️ getUserAvatar: Buscando avatar para:', cleanPhone, 'preview:', preview);
    
    const response = await fetch(`${API_BASE_URL}/user/avatar`, {
      method: 'POST',
      headers: {
        'Token': apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Phone: cleanPhone,
        Preview: preview,
      }),
    });

    console.log('🖼️ getUserAvatar: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ getUserAvatar: Erro na resposta:', errorData);
      return {
        success: false,
        error: errorData.error || errorData.message || 'Erro ao buscar foto de perfil',
      };
    }

    const data = await response.json();
    console.log('🖼️ getUserAvatar: Dados recebidos (completo):', JSON.stringify(data, null, 2));
    
    // A API pode retornar em diferentes formatos:
    // Formato 1 (documentação): { "URL": "...", "ID": "...", "Type": "...", "DirectPath": "..." }
    // Formato 2 (real): { "code": 200, "data": { "URL": "...", "ID": "..." }, "success": true }
    // Formato 3: { "code": 200, "data": { "data": { "URL": "..." } }, "success": true }
    
    let avatarUrl: string | undefined;
    let avatarId: string | undefined;
    
    // Tentar diferentes estruturas de resposta
    if (data.URL) {
      // Formato direto (documentação)
      avatarUrl = data.URL;
      avatarId = data.ID;
    } else if (data.data?.URL) {
      // Formato com data.URL
      avatarUrl = data.data.URL;
      avatarId = data.data.ID;
    } else if (data.data?.data?.URL) {
      // Formato aninhado
      avatarUrl = data.data.data.URL;
      avatarId = data.data.data.ID;
    } else if (data.url) {
      // Formato lowercase
      avatarUrl = data.url;
      avatarId = data.id;
    } else if (data.data?.url) {
      // Formato lowercase com data
      avatarUrl = data.data.url;
      avatarId = data.data.id;
    }
    
    if (avatarUrl) {
      console.log('✅ getUserAvatar: Avatar encontrado:', avatarUrl);
      return {
        success: true,
        url: avatarUrl,
        id: avatarId,
      };
    }

    console.warn('⚠️ getUserAvatar: URL não encontrada na resposta. Estrutura:', Object.keys(data));
    if (data.data) {
      console.warn('⚠️ getUserAvatar: Chaves em data:', Object.keys(data.data));
    }
    return {
      success: false,
      error: 'Foto de perfil não encontrada na resposta da API',
    };
  } catch (error: any) {
    console.error('❌ getUserAvatar: Erro geral:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar foto de perfil',
    };
  }
}

/**
 * Desconecta e remove uma instância (WUZAPI)
 * Primeiro faz logout, depois desconecta, e por fim deleta o usuário da API
 */
export async function deleteInstance(
  instanceName: string,
  apiToken: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log('Iniciando deleção da instância:', instanceName);
    
    // 1. Primeiro fazer logout (termina a sessão completamente)
    try {
      console.log('1. Fazendo logout da sessão...');
      const logoutResponse = await fetch(`${API_BASE_URL}/session/logout`, {
        method: 'POST',
        headers: {
          'Token': apiToken,
          'Content-Type': 'application/json',
        },
      });

      if (logoutResponse.ok) {
        console.log('✅ Logout realizado com sucesso');
      } else {
        const logoutData = await logoutResponse.json().catch(() => ({}));
        console.log('⚠️ Logout não necessário ou falhou:', logoutData.error || logoutData.message);
      }
    } catch (logoutError) {
      console.log('⚠️ Erro ao fazer logout (não crítico):', logoutError);
    }

    // 2. Tentar desconectar também (pode falhar se já foi feito logout)
    try {
      console.log('2. Desconectando sessão...');
      const disconnectResponse = await fetch(`${API_BASE_URL}/session/disconnect`, {
        method: 'POST',
        headers: {
          'Token': apiToken,
          'Content-Type': 'application/json',
        },
      });

      if (disconnectResponse.ok) {
        console.log('✅ Desconexão realizada com sucesso');
      } else {
        const disconnectData = await disconnectResponse.json().catch(() => ({}));
        console.log('⚠️ Desconexão não necessária ou falhou:', disconnectData.error || disconnectData.message);
      }
    } catch (disconnectError) {
      console.log('⚠️ Erro ao desconectar (não crítico):', disconnectError);
    }

    // 3. Obter lista de usuários para encontrar o ID correto
    let userId: string | null = null;
    try {
      console.log('3. Buscando lista de usuários para encontrar ID...');
      const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': WUZAPI_ADMIN_TOKEN,
          'Content-Type': 'application/json',
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success && usersData.data && Array.isArray(usersData.data)) {
          // Procurar usuário pelo nome ou token
          const user = usersData.data.find((u: any) => 
            u.name === instanceName || u.token === apiToken
          );
          
          if (user && user.id) {
            userId = user.id;
            console.log('✅ ID do usuário encontrado:', userId);
          } else {
            console.log('⚠️ Usuário não encontrado na lista (pode já ter sido deletado)');
          }
        }
      }
    } catch (usersError) {
      console.log('⚠️ Erro ao buscar lista de usuários:', usersError);
    }

    // 4. Deletar o usuário da API
    // Tentar primeiro pelo ID (mais confiável), depois pelo nome
    let deleteSuccess = false;
    let deleteError: string | null = null;

    if (userId) {
      console.log('4. Deletando usuário pelo ID:', userId);
      try {
        const deleteResponse = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': WUZAPI_ADMIN_TOKEN,
            'Content-Type': 'application/json',
          },
        });

        let deleteData: any = {};
        try {
          deleteData = await deleteResponse.json();
        } catch (e) {
          const text = await deleteResponse.text();
          deleteData = { error: text || 'Erro desconhecido' };
        }

        if (deleteResponse.ok || deleteResponse.status === 200) {
          console.log('✅ Usuário deletado com sucesso pelo ID');
          deleteSuccess = true;
        } else if (deleteResponse.status === 404) {
          console.log('⚠️ Usuário não encontrado pelo ID (pode já ter sido deletado)');
          deleteSuccess = true; // Considerar sucesso se não existe
        } else {
          deleteError = deleteData.error || deleteData.message || `Erro ao deletar (${deleteResponse.status})`;
          console.log('❌ Erro ao deletar pelo ID:', deleteError);
        }
      } catch (deleteError) {
        console.log('❌ Erro na requisição de deleção pelo ID:', deleteError);
        deleteError = 'Erro ao deletar pelo ID';
      }
    }

    // Se não conseguiu deletar pelo ID, tentar pelo nome
    if (!deleteSuccess && !userId) {
      console.log('4. Tentando deletar pelo nome:', instanceName);
      const encodedInstanceName = encodeURIComponent(instanceName);
      
      try {
        const deleteResponse = await fetch(`${API_BASE_URL}/admin/users/${encodedInstanceName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': WUZAPI_ADMIN_TOKEN,
            'Content-Type': 'application/json',
          },
        });

        let deleteData: any = {};
        try {
          deleteData = await deleteResponse.json();
        } catch (e) {
          const text = await deleteResponse.text();
          deleteData = { error: text || 'Erro desconhecido' };
        }

        if (deleteResponse.ok || deleteResponse.status === 200) {
          console.log('✅ Usuário deletado com sucesso pelo nome');
          deleteSuccess = true;
        } else if (deleteResponse.status === 404) {
          console.log('⚠️ Usuário não encontrado pelo nome (pode já ter sido deletado)');
          deleteSuccess = true; // Considerar sucesso se não existe
        } else {
          deleteError = deleteData.error || deleteData.message || `Erro ao deletar (${deleteResponse.status})`;
          console.log('❌ Erro ao deletar pelo nome:', deleteError);
        }
      } catch (deleteError) {
        console.log('❌ Erro na requisição de deleção pelo nome:', deleteError);
        deleteError = 'Erro ao deletar pelo nome';
      }
    }

    if (deleteSuccess) {
      return {
        success: true,
        message: 'Instância deletada com sucesso da API',
      };
    }

    return {
      success: false,
      error: deleteError || 'Não foi possível deletar a instância da API',
    };
  } catch (error: any) {
    console.error('❌ Error deleting instance:', error);
    return {
      success: false,
      error: error.message || 'Erro ao deletar instância',
    };
  }
}

