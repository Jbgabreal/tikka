const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function sendChatMessage(message: string, context: any = {}) {
  // Handle image step: send file as multipart/form-data
  if (context.currentStep === 'image' && context.attachments && context.attachments.length > 0) {
    const formData = new FormData();
    // Assume attachments[0] is a File or has a .file property
    const file = context.attachments[0].file || context.attachments[0];
    formData.append('file', file);
    if (context.walletAddress) {
      formData.append('walletAddress', context.walletAddress);
    }
    // Add any other fields needed by backend
    const endpoint = `${API_BASE_URL}/api/chat/token-creation`;
    console.log('[API] Sending image step to endpoint:', endpoint);
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to send image');
    return res.json();
  }

  // Default: send as JSON
  const endpoint = `${API_BASE_URL}/api/chat/message`;
  console.log('[API] Sending chat message to endpoint:', endpoint);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
} 